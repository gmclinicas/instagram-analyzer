export default function Home({ onChooseMethod }) {
  return (
    <div className="container">
      <div style={{ textAlign: 'center' }}>
        <h1>📊 Analisador de Perfil Instagram</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Envie o perfil do Instagram para análise completa de posicionamento
        </p>

        <div className="info-card">
          💡 <strong>Dica:</strong> Cole o link do perfil E suba também os prints pois link pode falhar
        </div>

        <p style={{ fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
          De que forma você quer começar?
        </p>

        <div className="options">
          <div className="option" onClick={() => onChooseMethod('link')}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔗</div>
            <h4>Cole o Link</h4>
            <p>Mais rápido</p>
          </div>

          <div className="option" onClick={() => onChooseMethod('upload')}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
            <h4>Suba os Screenshots</h4>
            <p>100% seguro</p>
          </div>
        </div>
      </div>
    </div>
  )
}
