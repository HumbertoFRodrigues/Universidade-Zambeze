-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 30/10/2024 às 10:24
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
  `numero_animais` int(11) NOT NULL,
  `numero_femeas` int(11) NOT NULL,
  `peso_maximo` float NOT NULL,
  `viabilidade_acasalamento` varchar(100) NOT NULL,
  `idade_maxima` int(11) NOT NULL,
  `imagem` varchar(255) DEFAULT NULL,
  `grupo` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `data` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `reclamacoes`
--

INSERT INTO `reclamacoes` (`id`, `user_id`, `tipo`, `comentarios`, `sugestoes`, `problema_animal`, `comentarios_animal`, `audio`, `data`) VALUES
(1, 17, 'atendimento', 'a', 'a', '', '', NULL, '2024-10-29 23:08:36'),
(2, 17, 'instalacoes', 'a', 'a', '', '', NULL, '2024-10-29 23:10:49'),
(3, 1, 'instalacoes', 'a', 'a', '', '', NULL, '2024-10-29 23:18:43'),
(4, 1, 'limpeza', 'a', 'a', '', '', NULL, '2024-10-29 23:39:00'),
(5, 1, 'limpeza', 's', 's', '', '', NULL, '2024-10-29 23:53:06');

-- --------------------------------------------------------

--
-- Estrutura para tabela `reservas`
--

CREATE TABLE `reservas` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `adultos` int(11) NOT NULL,
  `criancas` int(11) NOT NULL,
  `safari` int(11) NOT NULL,
  `alimentacao` int(11) NOT NULL,
  `hospedagem` int(11) NOT NULL,
  `espaco_evento` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `reservas`
--

INSERT INTO `reservas` (`id`, `user_id`, `adultos`, `criancas`, `safari`, `alimentacao`, `hospedagem`, `espaco_evento`, `total`, `created_at`) VALUES
(1, 15, 0, 0, 0, 0, 0, 3, 6000.00, '2024-10-30 00:26:41'),
(2, 15, 0, 0, 0, 0, 0, 0, 0.00, '2024-10-30 00:28:49'),
(3, 15, 2, 1, 1, 0, 0, 0, 1000.00, '2024-10-30 00:29:51'),
(4, 15, 0, 0, 1, 0, 0, 0, 500.00, '2024-10-30 07:44:21');

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
(2, 'humbertofuncionario', '$2y$10$Jynt51nXi.FNJhDtJuc4KuGWtF0tFuZniSLZeiOQwWC1Sf5GGlRfe', 2, 'Humberto', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'humberto@zoodaoldy.com', '2024-10-25 13:19:13', 'e2bd129cd442105c50fb1309e809bd02'),
(3, 'daivo', '$2y$10$jbso//30cTY8RZS3k4ov2uF6jJVAhQlob9BrK2yJcwdA2PNA6rQRS', 2, 'Daivo', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'daivo@zoodaoldy.com', '2024-10-25 13:19:13', '63e3be49e3a61104f277d08900cd2aae'),
(4, 'fernando', '$2y$10$vL4t5NZJvtwMt2Mf84Vrd.xdupUMoDm5FZFHunwa8dne569JS5jPC', 2, 'Fernando', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'fer@zoodaoldy.com', '2024-10-25 13:19:13', NULL),
(5, 'herque', '$2y$10$Iw2lGi5zwGrSI.aU8igQi.OQ3IxqUf.yjG9.kth/uY8JkOnm58svy', 2, 'Herque', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'herque@zoodaoldy.com', '2024-10-25 13:19:13', NULL),
(6, 'bartolomeu', '$2y$10$enws4DSLqdaeWLcjLj8oIuliKU5hX/v7eepiRBPXreXANcQHvj7JC', 2, 'Bartolomeu', NULL, 'M', NULL, NULL, NULL, NULL, 'Funcionário', 'bartolomeu@zoodaoldy.com', '2024-10-25 13:19:13', NULL),
(7, 'souvistante', '$2y$10$UirUEj9rbrMPPSoU9lMscuThQNLoHU05Rk6XF0B2egEEfNwUKZOM6', 3, 'Visitante', NULL, 'Outro', NULL, NULL, NULL, NULL, 'Visitante', 'usuarioteste@gmail.com', '2024-10-25 13:19:13', NULL),
(10, 'dd', '$2y$10$wMe1XKfuBkh1WQnb0LMY2OAbRR0EL.XbhQT.kKILk3qL4JEOMdzbG', 3, 'a', 'a', '', 'a', '+258', 'a', '2024-10-29', 'ss', 'contato@portaldomundo.com', '2024-10-29 05:42:15', NULL),
(11, 'teste', '$2y$10$W3a5iRPJpU9/76E.VstjVe6Cf8fCiTUJRVv5x7YNptejHXmbuWOKO', 3, 'asd', 'dd', '', 'aa', '+55', '445', '2024-10-30', 'ass', 'admin@a.a', '2024-10-29 05:46:28', NULL),
(13, 'blessings ', '$2y$10$Xi3es8WReFN92MEVM9qrhOtquBPWQekIVUvsICdvNKFNzap338rvy', 3, 'blessings', 'a', '', 'asd', '+258', '34', '2024-10-30', 's', 'ble@s.s', '2024-10-29 05:54:10', NULL),
(14, 'daiane', '$2y$10$L7xPqcYDzbcAw0rBX1fJ.OVuKqvTAnFLcii3aHX9viGpNya88tmFC', 1, 'princesa', 'a', 'F', 'add', 'Brasil', '234', '2024-10-29', 'dd', 'dai@a.a', '2024-10-29 06:08:42', NULL),
(15, 'simy', '$2y$10$/eXVXsoXhWERzlA26e6TBeePx3Y430netaE6jRA37NEKjmbrXqzb6', 3, 'Simiana', 'Muarica', 'F', 'Rua Eduardo mondlane', 'Moçambique', '846366233', '2024-10-21', 'Universitaria', 'simy@gmai.com', '2024-10-29 06:48:59', NULL),
(16, 'bia', '$2y$10$YWKL2YPgHvg7ZjblG2d3CO3Tuci8ny92.A8eBZOhBTTDvcZAl3yWW', 1, 'bia', 'ravia', 'F', 'chaimite', 'Moçambique', '822222322', '2002-09-27', 'ceo', 'bia@bia.com', '2024-10-29 21:56:17', NULL),
(17, 'pata', '$2y$10$4h/tzErDnHRp4s.FC9ld6eicMyTELa3dyuS6Y.NVocpIT0XeRVTzy', 3, 'pata', 'pata', 'F', 'aa', 'Moçambique', '2343', '2002-02-12', 'a', 'pata@g.a', '2024-10-29 22:03:22', NULL);

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
-- Índices de tabela `funcionarios`
--
ALTER TABLE `funcionarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `funcionarios`
--
ALTER TABLE `funcionarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `niveis`
--
ALTER TABLE `niveis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `reclamacoes`
--
ALTER TABLE `reclamacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `respostas`
--
ALTER TABLE `respostas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de tabela `visitantes`
--
ALTER TABLE `visitantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `funcionarios`
--
ALTER TABLE `funcionarios`
  ADD CONSTRAINT `funcionarios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

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
