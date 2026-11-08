// Políticas da loja. Formato do conteúdo: "## " inicia uma secção, "- " um item de lista,
// linhas em branco separam parágrafos (ver InfoPage.jsx).

const TERMOS = `Estes Termos e Condições regulam a utilização da loja online EasyShop e a compra de equipamentos de segurança (EPI, videovigilância, controlo de acessos, alarmes, cofres, combate a incêndios e proteção de redes). Ao registar-se ou concluir uma encomenda, o cliente declara que leu e aceita estes termos.

## 1. Enquadramento legal
Os contratos celebrados nesta loja regem-se pela lei da República de Moçambique, em especial:
- Lei n.º 22/2009, de 28 de Setembro — Lei de Defesa do Consumidor, e o respectivo Regulamento (Decreto n.º 27/2016, de 18 de Julho);
- Lei n.º 3/2017, de 9 de Janeiro — Lei das Transacções Electrónicas;
- Código Comercial (Decreto-Lei n.º 2/2005, de 27 de Dezembro);
- Código do Imposto sobre o Valor Acrescentado (IVA) em vigor.

## 2. Identificação do vendedor
A loja é operada pela EasyShop — Loja de Segurança e Proteção, com sede em Maputo. Os contactos, o NUIT e a morada estão disponíveis na página Contactos e em todas as facturas emitidas.

## 3. Conta de cliente
- O cliente é responsável pela veracidade dos dados fornecidos e pela confidencialidade da palavra-passe.
- Quando compra sem conta, a loja cria uma conta automaticamente com o email indicado, para permitir o acompanhamento da encomenda; o cliente pode alterar a palavra-passe ou pedir o encerramento da conta a qualquer momento.
- A loja pode suspender contas usadas de forma fraudulenta ou contrária a estes termos.

## 4. Produtos, preços e IVA
- Os preços são apresentados em Meticais (MZN) e incluem IVA à taxa legal em vigor (16%).
- As imagens são ilustrativas; as características vinculativas são as indicadas na descrição e na ficha técnica de cada produto.
- Em caso de erro manifesto de preço, a loja contacta o cliente antes do processamento e este pode confirmar ao preço correcto ou cancelar sem custos.
- Os descontos por quantidade e as promoções aplicam-se automaticamente no carrinho, nas condições e prazos anunciados.

## 5. Formação do contrato
O contrato considera-se celebrado quando a loja confirma a encomenda por email, nos termos da Lei das Transacções Electrónicas. Antes da confirmação, o cliente pode rever o resumo da encomenda, os custos de entrega e o total a pagar.

## 6. Pagamento
Aceitamos M-Pesa, e-Mola, cartão Visa/Mastercard, transferência bancária e numerário na entrega (quando disponível para a zona). As encomendas só entram em processamento após a confirmação do pagamento, excepto no pagamento contra-entrega. A factura é emitida automaticamente após a confirmação.

## 7. Clientes empresariais
Empresas e instituições podem pedir cotação para compras por quantidade. As condições de uma cotação aceite (preço, prazo e forma de pagamento) prevalecem sobre estes termos naquilo em que forem diferentes.

## 8. Utilização adequada dos equipamentos
Os equipamentos de proteção e segurança devem ser usados de acordo com as instruções do fabricante e as normas aplicáveis. A EasyShop não se responsabiliza por danos resultantes de utilização incorrecta, instalação não conforme ou alteração do produto.

## 9. Reclamações e resolução de litígios
O cliente pode apresentar reclamações através dos nossos contactos ou do Livro de Reclamações. Responderemos no prazo máximo de 15 dias úteis. Sem prejuízo do recurso à Inspecção Nacional das Actividades Económicas (INAE) e às associações de defesa do consumidor, é competente o foro da Cidade de Maputo.

## 10. Alterações
A loja pode actualizar estes termos; a versão aplicável é a que estava publicada no momento da encomenda.`

const ENTREGA = `Entregamos em todo o território moçambicano através de transporte próprio e de parceiros logísticos. Os prazos e custos são calculados no checkout, antes de confirmar a encomenda.

## Zonas e prazos indicativos
- Maputo Cidade e Matola: 1 a 2 dias úteis.
- Restantes capitais provinciais (Beira, Nampula, Quelimane, Tete, Chimoio, Xai-Xai, Inhambane, Lichinga, Pemba): 3 a 7 dias úteis.
- Outros distritos: prazo indicado no checkout ou combinado por telefone.
Os prazos contam a partir da confirmação do pagamento (ou da confirmação da encomenda, no pagamento contra-entrega).

## Modalidades
- Entrega ao domicílio ou na empresa, com contacto prévio do estafeta.
- Entrega expresso em Maputo e Matola, quando disponível.
- Levantamento gratuito na loja, mediante apresentação do código da encomenda e de documento de identificação.

## Custos de entrega
O valor do frete depende da zona e da modalidade escolhida e é sempre mostrado antes do pagamento. Campanhas de entrega gratuita são anunciadas na loja.

## Recepção da encomenda
- Verifique a embalagem no acto da entrega. Se estiver danificada, registe a observação no comprovativo e contacte-nos em 48 horas.
- Equipamentos volumosos (cofres, torniquetes, racks) são entregues ao nível do rés-do-chão; a instalação é um serviço à parte.
- Se o destinatário não estiver presente, faremos uma segunda tentativa; depois disso, a encomenda fica disponível para levantamento durante 10 dias.

## Atrasos
Se o prazo indicado não puder ser cumprido, informamos o cliente com a nova data. O cliente pode cancelar a encomenda e receber o reembolso integral se o atraso for superior a 15 dias, conforme os direitos previstos na Lei de Defesa do Consumidor.`

const DEVOLUCAO = `Queremos que fique satisfeito com a sua compra. Esta política complementa os direitos que a Lei n.º 22/2009 (Lei de Defesa do Consumidor) e o seu Regulamento reconhecem ao consumidor, e não os limita.

## Direito de devolução
- Pode devolver produtos comprados online no prazo de 7 dias a contar da entrega, sem necessidade de indicar o motivo.
- O produto deve estar sem uso, completo, com acessórios, manuais e embalagem original.
- Peça a devolução na sua área de cliente (Encomendas → Pedir devolução) ou através dos nossos contactos, indicando o código da encomenda.

## Produtos excluídos por razões de higiene ou segurança
Por razões de higiene e de segurança do utilizador, não são aceites devoluções de produtos de uso pessoal cuja embalagem selada tenha sido aberta:
- máscaras, respiradores descartáveis e filtros;
- tampões auditivos;
- luvas descartáveis.
Esta exclusão não se aplica a produtos com defeito.

## Produtos com defeito ou não conformes
Se o produto chegar danificado, com defeito ou diferente do encomendado, o cliente tem direito, à sua escolha, à reparação, substituição, redução do preço ou resolução do contrato com reembolso, nos termos da Lei de Defesa do Consumidor. Nestes casos, os custos de recolha são suportados pela loja.

## Custos de devolução
Na devolução sem motivo, o custo de envio do produto é suportado pelo cliente, salvo se o entregar na loja. Na devolução por defeito ou erro nosso, não há qualquer custo para o cliente.

## Reembolso
- Após a recepção e verificação do produto (até 5 dias úteis), o reembolso é feito pelo mesmo meio de pagamento usado na compra, no prazo máximo de 14 dias.
- Pagamentos M-Pesa e e-Mola são reembolsados para o mesmo número; transferências e pagamentos contra-entrega, para a conta bancária indicada pelo cliente.
- Os custos de entrega iniciais são reembolsados quando a devolução abrange toda a encomenda.
- É emitida nota de crédito correspondente à factura original.`

const PRIVACIDADE = `A EasyShop respeita a privacidade dos seus clientes. Esta política explica que dados pessoais recolhemos, para que os usamos e quais os seus direitos, em conformidade com a Constituição da República de Moçambique (artigos 41.º, direito à reserva da vida privada, e 71.º, utilização da informática) e com a Lei n.º 3/2017, de 9 de Janeiro (Lei das Transacções Electrónicas).

## Dados que recolhemos
- Identificação e contacto: nome, email, telefone e, para empresas, NUIT e designação social.
- Entrega: morada, cidade, província e ponto de referência.
- Encomendas e pagamentos: produtos comprados, valores, referência da operação e número de telemóvel usado no M-Pesa/e-Mola. Não guardamos dados completos de cartões nem PINs.
- Dados técnicos de sessão necessários à segurança da conta (data de acesso e endereço IP).

## Para que usamos os dados
- Processar encomendas, pagamentos, entregas, facturas, devoluções e garantias.
- Responder a pedidos de assistência e de cotação.
- Cumprir obrigações legais, fiscais e contabilísticas.
- Enviar comunicações sobre promoções, apenas quando o cliente o autoriza; pode cancelar a qualquer momento.

## Partilha de dados
Partilhamos apenas os dados estritamente necessários com:
- operadores de pagamento (Vodacom M-Pesa, Movitel e-Mola, bancos);
- transportadoras, para efectuar a entrega;
- autoridades, quando a lei o exija.
Nunca vendemos dados pessoais a terceiros.

## Segurança
As palavras-passe são guardadas cifradas, as comunicações usam ligação segura (HTTPS) e o acesso aos dados é restrito a pessoal autorizado. As sessões expiram automaticamente e o número de tentativas de entrada é limitado.

## Conservação
Os dados de facturação são conservados pelo prazo exigido pela legislação fiscal e comercial. Os restantes dados são eliminados ou anonimizados quando deixam de ser necessários ou a pedido do titular, salvo obrigação legal em contrário.

## Os seus direitos
Pode, a qualquer momento, pedir o acesso, a rectificação ou a eliminação dos seus dados, bem como opor-se ao envio de comunicações de marketing, através da sua área de cliente ou dos nossos contactos. Respondemos no prazo de 15 dias úteis.`

const GARANTIA = `Todos os produtos vendidos pela EasyShop são novos e beneficiam da garantia legal prevista na Lei n.º 22/2009 (Lei de Defesa do Consumidor) e no Código Comercial, sem prejuízo da garantia adicional do fabricante.

## Prazo de garantia
- Equipamentos electrónicos (câmeras, gravadores, alarmes, controlo de acessos, firewalls, switches, routers, UPS): 12 meses, ou o prazo do fabricante se for superior.
- Cofres e fechaduras: 24 meses para defeitos de fabrico do mecanismo.
- EPI (capacetes, calçado, vestuário, arneses): garantia contra defeitos de fabrico durante o prazo indicado pelo fabricante, respeitando a validade e a vida útil inscritas no produto.
- Baterias de UPS e consumíveis (filtros, cartuchos, tampões): 6 meses ou conforme o fabricante.
O prazo conta a partir da data da factura.

## O que a garantia cobre
Defeitos de fabrico e falta de conformidade com o anunciado. Durante a garantia, o cliente tem direito à reparação ou substituição sem encargos; se não for possível, à redução do preço ou ao reembolso.

## O que a garantia não cobre
- Danos por quedas, impactos, humidade ou utilização fora das especificações.
- Instalação, configuração ou reparação feitas por terceiros não autorizados.
- Desgaste normal de componentes e consumíveis.
- Equipamentos de proteção que já tenham sofrido um impacto ou uma queda (por exemplo, capacetes e arneses): por segurança, devem ser substituídos e não reparados.

## Como accionar a garantia
1. Contacte-nos com o código da encomenda ou a factura e uma descrição do problema (fotografias ajudam).
2. Indicamos se o produto deve ser entregue na loja ou recolhido.
3. Após diagnóstico, informamos a solução no prazo de 10 dias úteis. Reparações não devem exceder 30 dias; se excederem, o cliente pode pedir a substituição.

## Equipamentos de rede e segurança electrónica
Para firewalls, switches e câmeras IP, a garantia pode exigir a apresentação do número de série. As licenças de software (por exemplo, subscrições FortiGuard ou Sophos) seguem as condições do fabricante.`

export const POLITICAS = [
  ['TERMOS', 'Termos e condições', TERMOS],
  ['ENTREGA', 'Política de entrega', ENTREGA],
  ['DEVOLUCAO', 'Devoluções e reembolsos', DEVOLUCAO],
  ['PRIVACIDADE', 'Política de privacidade', PRIVACIDADE],
  ['GARANTIA', 'Garantia dos produtos', GARANTIA],
]
