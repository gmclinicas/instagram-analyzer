import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import AnalysisForm from './pages/AnalysisForm'
import Loading from './pages/Loading'
import Success from './pages/Success'

function App() {
  const [step, setStep] = useState('home') // home, link-form, upload-form, loading, success
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    consultoria: '',
    method: '', // 'link' or 'upload'
    profileUrl: '',
    images: []
  })
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleChooseMethod = (method) => {
    setFormData({ ...formData, method })
    setStep(`${method}-form`)
  }

  const handleFormSubmit = async (data) => {
    const newFormData = { ...formData, ...data }
    setFormData(newFormData)
    setStep('loading')

    // Converter imagens para base64 se houver upload
    let dataToSend = { ...newFormData }

    if (newFormData.images && newFormData.images.length > 0) {
      const imagesBase64 = await Promise.all(
        newFormData.images.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = reader.result.split(',')[1]
              resolve({
                base64,
                name: file.name,
                type: file.type
              })
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        })
      )
      dataToSend.images = imagesBase64
    }

    // Chamar Netlify Function
    try {
      const response = await fetch('/.netlify/functions/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const result = await response.json()

      if (result.status === 'success') {
        setAnalysisResult(result.data)
        setStep('success')
      } else {
        alert('Erro na análise: ' + result.error)
        setStep('home')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao conectar ao servidor')
      setStep('home')
    }
  }

  return (
    <div className="app">
      {step === 'home' && <Home onChooseMethod={handleChooseMethod} />}
      {(step === 'link-form' || step === 'upload-form') && (
        <AnalysisForm
          method={formData.method}
          onSubmit={handleFormSubmit}
          onBack={() => setStep('home')}
        />
      )}
      {step === 'loading' && <Loading />}
      {step === 'success' && (
        <Success
          result={analysisResult}
          email={formData.email}
          whatsapp={formData.whatsapp}
        />
      )}
    </div>
  )
}

export default App
