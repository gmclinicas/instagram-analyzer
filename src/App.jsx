import { useState } from 'react'
import './App.css'

function App() {
  const [step, setStep] = useState('form')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    consultoria: 'sim',
    images: []
  })
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, images: Array.from(e.target.files) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.name || !formData.email || !formData.whatsapp) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.images.length === 0) {
      setError('Suba pelo menos uma imagem do perfil')
      return
    }

    setStep('loading')

    try {
      // Converter imagens para base64
      const imagesBase64 = await Promise.all(
        formData.images.map(file => new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve({
            base64: reader.result.split(',')[1],
            name: file.name,
            type: file.type || 'image/jpeg'
          })
          reader.onerror = reject
          reader.readAsDataURL(file)
        }))
      )

      const response = await fetch('/.netlify/functions/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          consultoria: formData.consultoria,
          images: imagesBase64
        })
      })

      const result = await response.json()

      if (result.status === 'success') {
        setAnalysisResult(result.data)
        setStep('success')
      } else {
        setError(result.error || 'Erro desconhecido')
        setStep('form')
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao conectar ao servidor. Tente novamente.')
      setStep('form')
    }
  }

  // ==================== TELA LOADING ====================
  if (step === 'loading') {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-icon">⚽</div>
          <h2>Analisando seu perfil...</h2>
          <p className="loading-text">
            Isso pode demorar alguns minutos,<br />
            mas fica pronto antes do Brasil ganhar o hexa
          </p>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  // ==================== TELA SUCESSO ====================
  if (step === 'success') {
    const encodedMsg = encodeURIComponent(
      `Ola, acabei de fazer minha Analise de Perfil com o Analista de Posicionamento da GM. Meu telefone e email sao: ${formData.whatsapp} e ${formData.email}.`
    )
    const whatsappUrl = `https://wa.me/5516997571842?text=${encodedMsg}`

    return (
      <div className="app">
        <div className="card success-card">
          <div className="success-icon">✅</div>
          <h2>Analise Concluida!</h2>
          <p className="subtitle">Confira um resumo abaixo</p>

          {analysisResult && (
            <div className="preview-box">
              <h4>Resumo (50%)</h4>
              <ul>
                {analysisResult.insights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
              <p className="hint">
                Para analise completa com recomendacoes detalhadas, continue no WhatsApp
              </p>
            </div>
          )}

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            Pegar minha Analise de Perfil
          </a>
          <p className="footer-text">Clique para abrir WhatsApp com a equipe da GM Clinicas</p>
        </div>
      </div>
    )
  }

  // ==================== TELA FORMULARIO ====================
  return (
    <div className="app">
      <div className="card">
        <div className="header">
          <div className="logo-icon">GM</div>
          <h1>Analisador de Perfil</h1>
          <p className="subtitle">Envie screenshots do perfil Instagram para analise completa de posicionamento</p>
        </div>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              id="name" type="text" name="name"
              placeholder="Seu nome completo"
              value={formData.name} onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email" type="email" name="email"
              placeholder="seu@email.com"
              value={formData.email} onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="whatsapp">WhatsApp *</label>
            <input
              id="whatsapp" type="text" name="whatsapp"
              placeholder="(16) 99123-4567"
              value={formData.whatsapp} onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Deseja consultoria gratuita?</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio" name="consultoria" value="sim"
                  checked={formData.consultoria === 'sim'} onChange={handleInputChange}
                />
                <span>Sim, quero contato</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio" name="consultoria" value="nao"
                  checked={formData.consultoria === 'nao'} onChange={handleInputChange}
                />
                <span>Nao, so quero a analise</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Screenshots do Perfil Instagram *</label>
            <label htmlFor="file-input" className="upload-area">
              <input
                id="file-input" type="file" multiple accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-content">
                <span className="upload-icon">📸</span>
                {formData.images.length === 0 ? (
                  <p>Clique aqui para selecionar as imagens</p>
                ) : (
                  <p className="files-selected">{formData.images.length} arquivo(s) selecionado(s)</p>
                )}
                <span className="upload-hint">Bio, feed, destaques, reels</span>
              </div>
            </label>
          </div>

          <button type="submit" className="btn btn-primary">
            Analisar Perfil
          </button>
        </form>

        <p className="footer-text">
          Analise feita por IA com base no posicionamento visual do seu perfil
        </p>
      </div>
    </div>
  )
}

export default App
