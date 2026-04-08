import { useState } from 'react'

export default function AnalysisForm({ method, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    consultoria: 'nao',
    profileUrl: '',
    images: []
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, images: Array.from(e.target.files) })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.whatsapp) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (method === 'link' && !formData.profileUrl) {
      alert('Cole o link do perfil Instagram')
      return
    }

    if (method === 'upload' && formData.images.length === 0) {
      alert('Suba pelo menos uma imagem')
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '20px', background: 'none', border: 'none', color: '#4a90e2', cursor: 'pointer', fontSize: '14px' }}>
        ← Voltar
      </button>

      <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>
        Formulário de Análise
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome *</label>
          <input
            type="text"
            name="name"
            placeholder="Seu nome completo"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>WhatsApp *</label>
          <input
            type="text"
            name="whatsapp"
            placeholder="(16) 99123-4567"
            value={formData.whatsapp}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Deseja consultoria gratuita? *</label>
          <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                name="consultoria"
                value="sim"
                checked={formData.consultoria === 'sim'}
                onChange={handleInputChange}
              />
              Sim, quero contato
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                name="consultoria"
                value="nao"
                checked={formData.consultoria === 'nao'}
                onChange={handleInputChange}
              />
              Não, só quero a análise
            </label>
          </div>
        </div>

        {method === 'link' && (
          <div className="form-group">
            <label>Link do Perfil Instagram *</label>
            <input
              type="url"
              name="profileUrl"
              placeholder="instagram.com/seu_perfil"
              value={formData.profileUrl}
              onChange={handleInputChange}
              required
            />
          </div>
        )}

        {method === 'upload' && (
          <div className="form-group">
            <label>Suba seus Screenshots *</label>
            <div style={{
              border: '2px dashed #ccc',
              padding: '30px',
              textAlign: 'center',
              borderRadius: '6px',
              background: '#f9f9f9',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-input"
                required
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <p style={{ color: '#999', margin: 0 }}>
                  Arraste seus arquivos aqui ou clique para selecionar
                </p>
                {formData.images.length > 0 && (
                  <p style={{ color: '#4a90e2', margin: '10px 0 0 0', fontSize: '13px' }}>
                    {formData.images.length} arquivo(s) selecionado(s)
                  </p>
                )}
              </label>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Analisar Perfil
        </button>
      </form>
    </div>
  )
}
