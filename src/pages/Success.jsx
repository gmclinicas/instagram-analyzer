export default function Success({ result, email, whatsapp }) {
  const encodedMessage = encodeURIComponent(
    `olá, acabei de fazer minha Análise de Perfil com o Analista de Posicionamento da GM. Meu telefone e email são: ${whatsapp} e ${email}.`
  )
  const whatsappUrl = `https://wa.me/5516997571842?text=${encodedMessage}`

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
        <h2 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>Análise Concluída!</h2>
        <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>Confira um resumo abaixo</p>
      </div>

      {result && (
        <div style={{
          background: '#f5f5f5',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '13px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>📊 Resumo (50%)</h4>
          <ul style={{ margin: '10px 0', color: '#666' }}>
            {result.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
          <p style={{
            fontSize: '11px',
            color: '#999',
            margin: '10px 0 0 0',
            fontStyle: 'italic'
          }}>
            💡 Para análise completa com recomendações detalhadas, continue no WhatsApp →
          </p>
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <button className="btn btn-whatsapp" style={{ marginBottom: '10px' }}>
          🔗 Pegar minha Análise de Perfil
        </button>
      </a>

      <p style={{ textAlign: 'center', fontSize: '11px', color: '#999', margin: '0' }}>
        Clique para abrir WhatsApp com a equipe da GM Clínicas
      </p>
    </div>
  )
}
