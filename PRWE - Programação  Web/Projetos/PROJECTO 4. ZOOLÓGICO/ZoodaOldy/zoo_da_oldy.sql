-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 06/11/2024 às 10:15
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `zoo_da_oldy`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `animais`
--

CREATE TABLE `animais` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `especie` varchar(100) NOT NULL,
  `idade` int(11) DEFAULT NULL,
  `habitat` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `especies`
--

CREATE TABLE `especies` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `data_aquisicao` date NOT NULL,
  `num_animais` int(11) NOT NULL,
  `num_femeas` int(11) NOT NULL,
  `peso_maximo` float NOT NULL,
  `tipo` enum('mamifero','reptil','passaro') NOT NULL,
  `idade_maxima` int(11) NOT NULL,
  `mes_acasalamento_inicio` int(11) NOT NULL,
  `mes_acasalamento_fim` int(11) NOT NULL,
  `cor_caracteristica` varchar(100) NOT NULL,
  `gestacao_duracao` int(11) DEFAULT NULL,
  `comprimento_min` float DEFAULT NULL,
  `comprimento_max` float DEFAULT NULL,
  `periodo_gestacao` int(11) DEFAULT NULL,
  `comprimento_maximo` float DEFAULT NULL,
  `dieta` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `especies`
--

INSERT INTO `especies` (`id`, `nome`, `data_aquisicao`, `num_animais`, `num_femeas`, `peso_maximo`, `tipo`, `idade_maxima`, `mes_acasalamento_inicio`, `mes_acasalamento_fim`, `cor_caracteristica`, `gestacao_duracao`, `comprimento_min`, `comprimento_max`, `periodo_gestacao`, `comprimento_maximo`, `dieta`) VALUES
(1, 'Leão', '0000-00-00', 16, 11, 110, 'mamifero', 20, 0, 0, 'amarelo', 5, 0, 2, NULL, NULL, 'carnivoro'),
(3, 'Leão', '0000-00-00', 24, 12, 220, 'mamifero', 19, 0, 0, 'amarelo castanho', 3, 0, 3, NULL, NULL, 'carnivoro'),
(4, 'Águia-real (Aquila chrysaetos)', '0000-00-00', 5, 2, 7, 'passaro', 30, 0, 0, 'Marrom escuro com penas douradas na cabeça e pescoço', 45, NULL, 2.3, NULL, NULL, 'carnivoro'),
(5, 'Tucano-de-bico-preto (Ramphastos ambiguus)', '0000-00-00', 10, 3, 0.6, 'passaro', 20, 0, 0, 'Bico grande e colorido (preto, com detalhes amarelos e laranja); penas predominantemente pretas e am', 16, NULL, 0.73, NULL, NULL, 'onivoro'),
(6, 'Jiboia (Boa constrictor)', '0000-00-00', 7, 2, 27, 'reptil', 30, 0, 0, 'Padrão de cores variando entre tons de marrom, bege e verde oliva, com manchas escuras e bordas mais', 120, NULL, 4, NULL, NULL, 'carnivoro'),
(7, 'Javali (Tupinambis teguixin)', '2024-10-22', 14, 6, 5, 'reptil', 12, 10, 12, 'Pele com escamas negras e douradas, com uma coloração que pode variar entre tons de verde, amarelo e', 0, NULL, 1.5, NULL, NULL, 'onivoro'),
(9, 'Gorila (Gorilla gorilla)', '2024-11-06', 26, 14, 220, 'mamifero', 60, 0, 0, ' Pelagem escura, geralmente preta ou marrom escuro, com uma característica área prateada nas costas ', 255, NULL, 1.8, NULL, NULL, 'herbivoro');

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotos_especies`
--

CREATE TABLE `fotos_especies` (
  `id` int(11) NOT NULL,
  `especie_id` int(11) DEFAULT NULL,
  `caminho` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `fotos_especies`
--

INSERT INTO `fotos_especies` (`id`, `especie_id`, `caminho`) VALUES
(1, 3, 'especies/672b00b24071a_3.jpg'),
(2, 4, 'especies/672b046e8b677_aguia.jpg'),
(3, 5, 'especies/672b054d9a3cb_Tucano-de-bico-preto.jpeg'),
(4, 6, 'especies/672b063bcbebe_Jiboia (Boa constrictor).jpg'),
(5, 7, 'especies/672b20fd9eac9_javali.jpg'),
(7, 9, 'especies/672b2d0a9ea6b_Gorila (Gorilla gorilla).jpg');

-- --------------------------------------------------------

--
-- Estrutura para tabela `funcionarios`
--

CREATE TABLE `funcionarios` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `cargo` varchar(50) NOT NULL,
  `data_contratacao` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `logins_temporarios`
--

CREATE TABLE `logins_temporarios` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `validade` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expira_em` datetime NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `logins_temporarios`
--

INSERT INTO `logins_temporarios` (`id`, `user_id`, `token`, `validade`, `created_at`, `expira_em`, `criado_em`) VALUES
(1, 3, '310c18ba00425e3cc3d225ded8937677', 1730834194, '2024-11-05 19:11:34', '2024-11-05 21:46:55', '2024-11-05 22:29:16'),
(2, 16, '2caa767dc076e649e681c6175d883022', 1730835912, '2024-11-05 19:40:12', '2024-11-05 21:46:55', '2024-11-05 22:29:16'),
(3, 14, '2126be4b86cb65e4e4f49e0251474d65', 0, '2024-11-05 20:00:14', '2024-11-05 21:05:14', '2024-11-05 22:29:16'),
(4, 14, '43c1762fc5b9941b9360f42c7a9faa07', 0, '2024-11-05 20:01:32', '2024-11-05 21:06:32', '2024-11-05 22:29:16'),
(5, 13, 'f9a463d49ff4fad28fe33dab79edceaf', 0, '2024-11-05 20:05:15', '2024-11-05 21:10:15', '2024-11-05 22:29:16'),
(6, 16, '0224fc2a50da4272d9a2e3383bb8a3a4', 0, '2024-11-05 20:07:45', '2024-11-05 21:12:45', '2024-11-05 22:29:16'),
(7, 14, '938cf33555c8a32e8fdd56c414f8f41a', 0, '2024-11-05 20:10:36', '2024-11-05 21:40:36', '2024-11-05 22:29:16'),
(8, 14, '1a679e4b44c4d7a60780920679a8b05b', 0, '2024-11-05 20:14:40', '2024-11-05 21:44:40', '2024-11-05 22:29:16'),
(9, 16, 'a518050357a5c1709bdde84475478a87', 0, '2024-11-05 20:20:37', '2024-11-05 21:50:37', '2024-11-05 22:29:16'),
(10, 14, 'b451ea1d1c139b95f786e9025ee6867d', 0, '2024-11-05 20:31:03', '2024-11-05 23:01:03', '2024-11-05 22:31:03'),
(11, 5, '90bea4320880590cc2a7ec06b984968e', 0, '2024-11-05 20:31:58', '2024-11-05 23:01:58', '2024-11-05 22:31:58'),
(12, 3, '290ede4c63b8c4f83b9e607414eea13f', 0, '2024-11-05 21:16:48', '2024-11-05 23:46:48', '2024-11-05 23:16:48'),
(13, 1, 'b00bbf7ab5f09ed5ce7ab1bd52cdc676', 0, '2024-11-05 21:26:40', '2024-11-05 23:56:40', '2024-11-05 23:26:40'),
(14, 19, '35b3a99acfb3cc51c448572cec2bef34', 0, '2024-11-05 21:27:34', '2024-11-05 23:57:34', '2024-11-05 23:27:34'),
(15, 3, '8f220141587e2752a341e1afeb8c67fe', 0, '2024-11-05 21:38:22', '2024-11-06 00:08:22', '2024-11-05 23:38:22'),
(16, 4, '45841769f560e451a72f591d4ffb4733', 0, '2024-11-05 21:40:04', '2024-11-06 00:10:04', '2024-11-05 23:40:04'),
(17, 14, '6f2894d229a8294484f5c47958ee2e34', 0, '2024-11-05 21:43:54', '2024-11-06 00:13:54', '2024-11-05 23:43:54'),
(18, 11, 'dbec7ac7d8acf346cdb44a2143279747', 0, '2024-11-05 21:48:53', '2024-11-06 00:18:53', '2024-11-05 23:48:53'),
(19, 11, 'c095bf0fcd15e1c6417ff4ba2698c772', 0, '2024-11-05 21:49:46', '2024-11-06 00:19:46', '2024-11-05 23:49:46'),
(20, 13, 'fe51f1ee0a2fd76062fded55286efde1', 0, '2024-11-05 21:58:59', '2024-11-06 00:28:59', '2024-11-05 23:58:59'),
(21, 1, 'ce8314c7132896c570aa30513680fbb5', 0, '2024-11-05 22:17:14', '2024-11-06 00:47:14', '2024-11-06 00:17:14'),
(22, 17, '2f90332a8fde9cb2d51f24fff9aef06b', 0, '2024-11-05 22:23:46', '2024-11-06 00:53:46', '2024-11-06 00:23:46'),
(24, 1, 'e7f69a18a92d3ad5bd62a502144b27df', 0, '2024-11-05 22:31:55', '2024-11-06 01:01:55', '2024-11-06 00:31:55'),
(25, 19, 'fd6c08fc7ae977279a18a5f0c5a1072a', 0, '2024-11-06 00:15:28', '2024-11-06 02:45:28', '2024-11-06 02:15:28');

-- --------------------------------------------------------

--
-- Estrutura para tabela `niveis`
--

CREATE TABLE `niveis` (
  `id` int(11) NOT NULL,
  `nivel_nome` enum('administrador','funcionario','visitante') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `niveis`
--

INSERT INTO `niveis` (`id`, `nivel_nome`) VALUES
(1, 'administrador'),
(2, 'funcionario'),
(3, 'visitante');

-- --------------------------------------------------------

--
-- Estrutura para tabela `reclamacoes`
--

CREATE TABLE `reclamacoes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tipo` varchar(255) NOT NULL,
  `comentarios` text DEFAULT NULL,
  `sugestoes` text DEFAULT NULL,
  `problema_animal` varchar(255) DEFAULT NULL,
  `comentarios_animal` text DEFAULT NULL,
  `audio` longblob DEFAULT NULL,
  `data` timestamp NOT NULL DEFAULT current_timestamp(),
  `resposta` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `reclamacoes`
--

INSERT INTO `reclamacoes` (`id`, `user_id`, `tipo`, `comentarios`, `sugestoes`, `problema_animal`, `comentarios_animal`, `audio`, `data`, `resposta`) VALUES
(1, 17, 'atendimento', 'a', 'a', '', '', NULL, '2024-10-29 23:08:36', NULL),
(2, 17, 'instalacoes', 'a', 'a', '', '', NULL, '2024-10-29 23:10:49', 'esse teste: com lorem ipsum \"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?\"'),
(3, 1, 'instalacoes', 'a', 'a', '', '', NULL, '2024-10-29 23:18:43', NULL),
(4, 1, 'limpeza', 'a', 'a', '', '', NULL, '2024-10-29 23:39:00', NULL),
(5, 1, 'limpeza', 's', 's', '', '', NULL, '2024-10-29 23:53:06', NULL),
(6, 1, 'instalacoes', 'a', 'a', '', '', NULL, '2024-11-05 12:39:46', NULL),
(7, 1, 'atendimento', 'muito bom', 'nada', '', '', NULL, '2024-11-05 12:49:08', NULL),
(8, 1, 'instalacoes', 'a', 'a', '', '', NULL, '2024-11-05 13:43:22', NULL),
(9, 1, 'instalacoes', 'a', 'a', '', '', NULL, '2024-11-05 14:00:21', NULL),
(10, 1, 'animais', 'a', 'a', 'magros', 'a', NULL, '2024-11-05 14:21:49', NULL),
(11, 1, 'animais', 'a', 'a', 'magros', 'a', NULL, '2024-11-05 14:22:38', NULL),
(12, 1, 'atendimento', 'a', 'a', '', '', NULL, '2024-11-05 14:25:14', NULL),
(13, 1, 'animais', 'a', 'a', 'condicoes', 'a', NULL, '2024-11-05 14:31:31', NULL),
(14, 1, 'animais', 'a', 'a', 'magros', 'a', NULL, '2024-11-05 14:47:57', NULL),
(15, 1, 'animais', 'a', 'a', '', '', NULL, '2024-11-05 14:57:37', NULL),
(16, 1, 'animais', 'ggg', 'yy', 'limpeza', 'a', NULL, '2024-11-05 15:10:24', NULL),
(17, 1, 'animais', 'teste a', 'aaaaaaaa', 'condicoes', 'teste aaaa', NULL, '2024-11-05 15:11:19', NULL),
(18, 1, 'outros', 'patapatapat', 'patapatapat', '', '', NULL, '2024-11-05 15:12:52', NULL),
(19, 18, 'animais', 'vvvvvvvvv', 'vvvvvvvvvvvv', 'limpeza', 'vvvvvvvvvvvv', 0x2e2e2f75706c6f6164732f313733303832313135382e776176, '2024-11-05 15:39:18', NULL),
(20, 18, 'animais', 'vvvvvvvvv', 'vvvvvvvvvvvv', 'limpeza', 'vvvvvvvvvvvv', 0x2e2e2f75706c6f6164732f313733303832313136322e776176, '2024-11-05 15:39:22', NULL),
(21, 18, 'animais', 'vvvvvvvvv', 'vvvvvvvvvvvv', 'limpeza', 'vvvvvvvvvvvv', 0x2e2e2f75706c6f6164732f313733303832313136322e776176, '2024-11-05 15:39:22', NULL),
(22, 18, 'animais', 'vvvvvvvvv', 'vvvvvvvvvvvv', 'limpeza', 'vvvvvvvvvvvv', 0x2e2e2f75706c6f6164732f313733303832313136322e776176, '2024-11-05 15:39:22', NULL),
(23, 18, 'atendimento', 'aa', 'aa', '', '', 0x2e2e2f75706c6f6164732f313733303832313435392e776176, '2024-11-05 15:44:19', NULL),
(24, 18, 'instalacoes', 'saaaaaaaaaaaaaaaaaaaaaaa', 'saaaaaaaaaaaaa', '', '', 0x2e2e2f75706c6f6164732f313733303832313539322e776176, '2024-11-05 15:46:32', NULL),
(25, 15, 'animais', 'simy simy', 'simy simiana', 'condicoes', 'simy simy', 0x2e2e2f75706c6f6164732f313733303832313832332e776176, '2024-11-05 15:50:23', NULL),
(26, 15, 'outros', 'Testando', 'se vai essa vai', '', '', NULL, '2024-11-05 16:08:42', 'este é um teste mais longo para ver como fica a tabela, pos o maximo a ser exibido é 30 caracteres para resposta e nao destorcer a tabela.'),
(27, 15, 'outros', 'teste vou parar audio', 'essa via', '', '', 0x2e2e2f75706c6f6164732f313733303832323936352e776176, '2024-11-05 16:09:25', 'ta certo'),
(28, 17, 'animais', 'Os leioes sao agressivos', 'vacinação em dia', 'higiene', 'Leoes', 0x2e2e2f75706c6f6164732f313733303832393639312e776176, '2024-11-05 18:01:31', 'tomaremos mediadas');

-- --------------------------------------------------------

--
-- Estrutura para tabela `reservas`
--

CREATE TABLE `reservas` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tipo_reserva` varchar(100) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `status` enum('Aguardando Aprovação','Aprovada','Rejeitada') DEFAULT 'Aguardando Aprovação',
  `data_reserva` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `reservas`
--

INSERT INTO `reservas` (`id`, `user_id`, `tipo_reserva`, `valor_total`, `status`, `data_reserva`) VALUES
(1, 15, 'entrada_adulto', 200.00, 'Aprovada', '2024-11-06 02:05:01'),
(2, 18, 'safari', 500.00, 'Rejeitada', '2024-11-06 09:16:44');

-- --------------------------------------------------------

--
-- Estrutura para tabela `respostas`
--

CREATE TABLE `respostas` (
  `id` int(11) NOT NULL,
  `reclamacao_id` int(11) NOT NULL,
  `resposta` text NOT NULL,
  `data_resposta` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nivel_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `apelido` varchar(100) DEFAULT NULL,
  `sexo` enum('M','F','Outro') NOT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `nacionalidade` varchar(100) DEFAULT NULL,
  `telefone` varchar(15) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `ocupacao` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `password`, `nivel_id`, `nome`, `apelido`, `sexo`, `endereco`, `nacionalidade`, `telefone`, `data_nascimento`, `ocupacao`, `email`, `created_at`, `reset_token`) VALUES
(1, 'oldivanda', '$2y$10$6XT/f2KcI/PnqLodrxvcOu8em7d3wk79ZsON82cnpWOfGYNkxgUkq', 1, 'Oldivanda', NULL, 'F', NULL, NULL, NULL, NULL, 'Administradora', 'oldivanda@zoodaoldy.com', '2024-10-25 13:19:13', NULL),
(2, 'humbertofuncionario', '$2y$10$lrS6zj8arhtegPp5auvlNeAqW9ifaIyuxRc.ThLgOvDyEqmR5NwJ2', 2, 'Humberto', NULL, 'M', 'chaimite', 'mz', '846366233', NULL, 'Funcionário', 'humberto@zoodaoldy.com', '2024-10-25 13:19:13', 'e2bd129cd442105c50fb1309e809bd02'),
(3, 'daivo', '$2y$10$jbso//30cTY8RZS3k4ov2uF6jJVAhQlob9BrK2yJcwdA2PNA6rQRS', 2, 'Daivo', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'daivo@zoodaoldy.com', '2024-10-25 13:19:13', '63e3be49e3a61104f277d08900cd2aae'),
(4, 'fernando', '$2y$10$vL4t5NZJvtwMt2Mf84Vrd.xdupUMoDm5FZFHunwa8dne569JS5jPC', 2, 'Fernando', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'fer@zoodaoldy.com', '2024-10-25 13:19:13', NULL),
(5, 'herque', '$2y$10$Iw2lGi5zwGrSI.aU8igQi.OQ3IxqUf.yjG9.kth/uY8JkOnm58svy', 2, 'Herque', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'herque@zoodaoldy.com', '2024-10-25 13:19:13', NULL),
(6, 'bartolomeu', '$2y$10$enws4DSLqdaeWLcjLj8oIuliKU5hX/v7eepiRBPXreXANcQHvj7JC', 2, 'Bartolomeu', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'bartolomeu@zoodaoldy.com', '2024-10-25 13:19:13', NULL),
(7, 'souvistante', '$2y$10$UirUEj9rbrMPPSoU9lMscuThQNLoHU05Rk6XF0B2egEEfNwUKZOM6', 3, 'Visitante', NULL, 'Outro', NULL, NULL, NULL, NULL, 'Visitante', 'usuarioteste@gmail.com', '2024-10-25 13:19:13', NULL),
(11, 'teste', '$2y$10$W3a5iRPJpU9/76E.VstjVe6Cf8fCiTUJRVv5x7YNptejHXmbuWOKO', 3, 'ana', 'maria', '', 'aa', '+55', '445', '2024-10-30', 'ass', 'teste@ana.com', '2024-10-29 05:46:28', NULL),
(13, 'mario', '$2y$10$Xi3es8WReFN92MEVM9qrhOtquBPWQekIVUvsICdvNKFNzap338rvy', 3, 'mario', 'americo', 'M', 'rua armando tivane', '+258', '34', '2024-10-30', 's', 'grandemario12@yahoo.com', '2024-10-29 05:54:10', NULL),
(14, 'daiane', '$2y$10$L7xPqcYDzbcAw0rBX1fJ.OVuKqvTAnFLcii3aHX9viGpNya88tmFC', 3, 'abel', 'martis', 'M', 'esturo', 'Brasil', '234', '2024-10-29', 'dd', 'abelmartins@abel.com', '2024-10-29 06:08:42', NULL),
(15, 'simy', '$2y$10$/eXVXsoXhWERzlA26e6TBeePx3Y430netaE6jRA37NEKjmbrXqzb6', 3, 'Simiana', 'Muarica', 'F', 'Rua Eduardo mondlane', 'Moçambique', '846366233', '2024-10-21', 'Universitaria', 'simy@gmai.com', '2024-10-29 06:48:59', NULL),
(16, 'bia', '$2y$10$YWKL2YPgHvg7ZjblG2d3CO3Tuci8ny92.A8eBZOhBTTDvcZAl3yWW', 3, 'bia', 'ravia', 'F', 'chaimite', 'Moçambique', '822222322', '2002-09-27', 'ceo', 'bia@bia.com', '2024-10-29 21:56:17', NULL),
(17, 'pata', '$2y$10$4h/tzErDnHRp4s.FC9ld6eicMyTELa3dyuS6Y.NVocpIT0XeRVTzy', 3, 'pata', 'pata', 'F', 'aa', 'Moçambique', '2343', '2002-02-12', 'a', 'pata@g.a', '2024-10-29 22:03:22', NULL),
(18, 'a', '$2y$10$u2r45B1wbK8okL57cLHzS.0ILnnesn/SFAtlDMneI7GdQsxv1MMhG', 3, 'a', 's', 'M', 's', 'Moçambique', 'd', '2004-02-20', 'd', 'a@a.a', '2024-11-03 22:52:24', NULL),
(19, 'princesa', '$2y$10$1.DvixMqrrW.SKDEQ2cqYOk1l99kS1GGsF4VaiT7U3AWzqiOcG2x.', 3, 'princesa', 'daiane', 'F', 'Rua Eduardo mondlane', 'Outro', '8846366233', '2007-02-20', 'estudante', 'princesa@daiane.com', '2024-11-04 10:54:52', NULL),
(21, 'daianaa', '$2y$10$Bv2wSk.3Cu94birhXwuxZ.T8w2tetLir9vCHjkn8B7ihRafrdKuBe', 3, 'maria ', 'testes', 'Outro', 'a', 'Moçambique', '2343', '1994-02-20', 'engenheira', 'maria@gmail.com', '2024-11-04 11:34:40', '38b2fdb3a3d6113ca082657113883473');

-- --------------------------------------------------------

--
-- Estrutura para tabela `visitantes`
--

CREATE TABLE `visitantes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `data_visita` date NOT NULL,
  `quantidade` int(11) NOT NULL,
  `tipo_ingresso` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `animais`
--
ALTER TABLE `animais`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `especies`
--
ALTER TABLE `especies`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `fotos_especies`
--
ALTER TABLE `fotos_especies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `especie_id` (`especie_id`);

--
-- Índices de tabela `funcionarios`
--
ALTER TABLE `funcionarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `logins_temporarios`
--
ALTER TABLE `logins_temporarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `niveis`
--
ALTER TABLE `niveis`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `reclamacoes`
--
ALTER TABLE `reclamacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `respostas`
--
ALTER TABLE `respostas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reclamacao_id` (`reclamacao_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `nivel_id` (`nivel_id`);

--
-- Índices de tabela `visitantes`
--
ALTER TABLE `visitantes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `animais`
--
ALTER TABLE `animais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `especies`
--
ALTER TABLE `especies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `fotos_especies`
--
ALTER TABLE `fotos_especies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `funcionarios`
--
ALTER TABLE `funcionarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `logins_temporarios`
--
ALTER TABLE `logins_temporarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de tabela `niveis`
--
ALTER TABLE `niveis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `reclamacoes`
--
ALTER TABLE `reclamacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de tabela `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `respostas`
--
ALTER TABLE `respostas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de tabela `visitantes`
--
ALTER TABLE `visitantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `fotos_especies`
--
ALTER TABLE `fotos_especies`
  ADD CONSTRAINT `fotos_especies_ibfk_1` FOREIGN KEY (`especie_id`) REFERENCES `especies` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `funcionarios`
--
ALTER TABLE `funcionarios`
  ADD CONSTRAINT `funcionarios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `logins_temporarios`
--
ALTER TABLE `logins_temporarios`
  ADD CONSTRAINT `logins_temporarios_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `reclamacoes`
--
ALTER TABLE `reclamacoes`
  ADD CONSTRAINT `reclamacoes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `respostas`
--
ALTER TABLE `respostas`
  ADD CONSTRAINT `respostas_ibfk_1` FOREIGN KEY (`reclamacao_id`) REFERENCES `reclamacoes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`nivel_id`) REFERENCES `niveis` (`id`);

--
-- Restrições para tabelas `visitantes`
--
ALTER TABLE `visitantes`
  ADD CONSTRAINT `visitantes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
