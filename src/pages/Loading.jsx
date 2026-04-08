export default function Loading() {
  return (
    <div className="container loading-container">
      <div style={{ fontSize: '48px' }}>⚽</div>
      <h2 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Analisando seu perfil...</h2>
      <p style={{ color: '#666', textAlign: 'center', margin: '0 0 20px 0', fontSize: '15px' }}>
        Isso pode demorar alguns minutos,<br />
        mas fica pronto antes do Brasil ganhar o hexa 🇧🇷
      </p>
      <div className="spinner"></div>
    </div>
  )
}
