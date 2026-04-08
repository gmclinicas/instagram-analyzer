import puppeteer from 'puppeteer';

export async function scrapeInstagramProfile(profileUrl) {
  let browser;
  try {
    // Normalizar URL
    const username = profileUrl.includes('instagram.com')
      ? profileUrl.split('/').filter(Boolean).pop()
      : profileUrl;

    console.log(`Iniciando web scraping para: ${username}`);

    // Usar headless chrome no Netlify (browserless ou chrome-aws-lambda em produção)
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Timeout de 30 segundos
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Acessar perfil
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle2'
    });

    // Extrair dados (públicos)
    const profileData = await page.evaluate(() => {
      const bio = document.querySelector('[data-testid="bio"]')?.innerText || 'Bio não disponível';
      const followers = document.querySelector('header svg')?.parentElement?.innerText || 'Seguidores não disponível';
      const profileImage = document.querySelector('img[alt*="profile"]')?.src || null;

      return {
        bio,
        followers,
        profileImage,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
    });

    // Scroll para obter posts
    const posts = [];
    let previousHeight = 0;
    for (let i = 0; i < 12; i++) {
      const postElements = await page.$$('img[alt]');
      for (let j = posts.length; j < postElements.length; j++) {
        try {
          const post = await postElements[j].evaluate(el => ({
            src: el.src,
            alt: el.alt
          }));
          posts.push(post);
          if (posts.length >= 12) break;
        } catch (e) {
          console.log('Erro ao extrair post:', e.message);
        }
      }
      if (posts.length >= 12) break;

      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);
    }

    await browser.close();

    return {
      success: true,
      data: {
        ...profileData,
        posts: posts.slice(0, 12),
        metodUso: 'web-scraping'
      }
    };

  } catch (error) {
    console.error('Erro no web scraping:', error.message);
    if (browser) await browser.close();

    return {
      success: false,
      error: error.message,
      message: 'Não conseguimos acessar o perfil do Instagram. Por favor, envie screenshots ao invés disso.'
    };
  }
}
