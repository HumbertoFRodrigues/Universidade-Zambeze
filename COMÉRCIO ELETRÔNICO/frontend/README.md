# Frontend - EasyShop

Frontend da loja EasyShop, construído com React 19, Vite e React Router.

## Estrutura

```text
src/
├── App.jsx                 # Rotas activas
├── main.jsx                # Arranque da aplicação e providers globais
├── components/
│   ├── layout/             # Layout, navegação, banner e rodapé activos
│   ├── home/               # Secções da página inicial
│   ├── admin/              # Componentes para a área de administração
│   ├── cart/               # Componentes e estado do carrinho
│   └── ui/                 # Componentes UI reutilizáveis
├── contexto/               # Estado do carrinho da loja
├── dados/                  # Dados locais usados pela loja
├── hooks/                  # Hooks de catálogo e acesso a dados
├── pages/                  # Páginas da loja
│   └── admin/              # Páginas de administração preservadas
├── services/               # Acesso à API e utilitários de serviço
└── styles/                 # CSS da aplicação
```

As páginas usadas pela loja estão em `src/pages`; a composição das rotas fica em
`src/App.jsx`. O layout partilhado pelas páginas está em `src/components/layout`.
As secções da página inicial estão agrupadas em `src/components/home`.

## Rotas activas

| Rota | Página |
|------|--------|
| `/` | Página inicial |
| `/produtos` | Catálogo |
| `/produtos/:slug` | Detalhe do produto |
| `/carrinho` | Carrinho |
| `/pagamento` | Pagamento |
| `/empresas` | Compras para empresas |
| `/login` | Entrar na conta |
| `/register` | Criar conta |
| `/recuperar` | Recuperar acesso |
| `/conta` | Perfil e moradas da conta |
| `/info/:pagina` | Informação e políticas |
| `*` | Página não encontrada |

Os módulos de autenticação e administração existentes foram mantidos, mas as
respectivas páginas ainda não estão ligadas às rotas activas.

## Comandos

Executar a partir da raiz do repositório:

```bash
npm run dev -w frontend
npm run build -w frontend
npm run check -w frontend
```
