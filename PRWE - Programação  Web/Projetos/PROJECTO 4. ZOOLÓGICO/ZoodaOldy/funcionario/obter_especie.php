<?php
require '../db_conexao.php';
$conn = conectarBancoDeDados();

$id = $_GET['id'];
$stmt = $conn->prepare("SELECT * FROM especies WHERE id = ?");
$stmt->execute([$id]);
$especie = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($especie);
