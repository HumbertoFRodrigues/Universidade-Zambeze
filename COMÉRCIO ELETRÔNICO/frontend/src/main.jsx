import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App.jsx'
import { AcessoRestrito } from './components/AcessoRestrito.jsx'
import { CarrinhoProvider } from './contexto/CarrinhoContexto.jsx'
import { AuthProvider } from './lib/AuthContext.jsx'
import './index.css'
import './styles/variaveis.css'
import './styles/global.css'
import './styles/cores.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CarrinhoProvider>
          <App />
        </CarrinhoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)