import { Router } from 'express'
import { registar, login, loginAdmin, obterSessao, terminarSessao, postEsquecerPalavraPasse, postReporPalavraPasse } from '../controllers/auth.controller.js'
import { registarEmpresa } from '../controllers/empresa.controller.js'
import { verificarSessao } from '../middlewares/auth.middleware.js'
import { limiteLogin, limiteRecuperacao } from '../middlewares/limite-tentativas.middleware.js'
import { contarFalhasLogin } from '../middlewares/bloqueio-ip.middleware.js'

export const authRoutes = Router()

// Login normal para clientes (Loja)
authRoutes.post('/registar', registar)
// Registo de empresa (B2B): fica PENDENTE até o administrador da loja aprovar.
authRoutes.post('/registar-empresa', registarEmpresa)
authRoutes.post('/login', contarFalhasLogin, limiteLogin, login)

// Login exclusivo para o Backoffice (Admin)
authRoutes.post('/admin/login', contarFalhasLogin, limiteLogin, loginAdmin)

// Gestão de sessão
authRoutes.get('/me', verificarSessao, obterSessao)
authRoutes.post('/logout', verificarSessao, terminarSessao)
authRoutes.post('/esquecer-palavra-passe', limiteRecuperacao, postEsquecerPalavraPasse)
authRoutes.post('/repor-palavra-passe', postReporPalavraPasse)