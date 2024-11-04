<?php
// Configurações do banco de dados
$host = 'localhost';
$dbname = 'zoo_da_oldy';
$user = 'root';
$password = '';

// Função para conectar ao banco de dados
function conectarBancoDeDados() {
    global $host, $dbname, $user, $password;

    try {
        // Criando uma nova instância de PDO Exceções e Tratamento de Erros:
        $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
        // Configurando o PDO para lançar exceções em caso de erro
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        // Exibindo mensagem de erro caso a conexão falhe
        die("Erro de conexão: " . $e->getMessage());
    }
}

// Uso: Sempre que precisar de uma conexão, chamamos a função
$conn = conectarBancoDeDados();
