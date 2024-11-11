#include <iostream>
#include <vector>
#include <string>

// Defini‡Æo da estrutura de aluno
struct Aluno {
    std::string nome;
    int idade;
    double nota;
};

int main() {
    std::vector<Aluno> alunos; // Vetor para armazenar os alunos cadastrados
    int opcao; // Vari vel para armazenar a op‡Æo escolhida pelo usu rio

    while (true) {
        std::cout << "Sistema de Cadastro de Alunos\n";
        std::cout << "1. Cadastrar Aluno\n";
        std::cout << "2. Listar Alunos\n";
        std::cout << "3. Sair\n";
        std::cout << "Escolha uma op‡Æo: ";
        std::cin >> opcao; // Lˆ a op‡Æo escolhida pelo usu rio

        switch (opcao) {
            case 1: {
                Aluno novoAluno; // Cria uma instƒncia da estrutura Aluno para cadastrar um novo aluno
                std::cin.ignore(); // Limpa o buffer de entrada
                std::cout << "Digite o nome do aluno: ";
                std::getline(std::cin, novoAluno.nome); // Lˆ o nome do aluno (pode conter espa‡os)
                std::cout << "Digite a idade do aluno: ";
                std::cin >> novoAluno.idade; // Lˆ a idade do aluno
                std::cout << "Digite a nota do aluno: ";
                std::cin >> novoAluno.nota; // Lˆ a nota do aluno

                alunos.push_back(novoAluno); // Adiciona o novo aluno ao vetor de alunos
                std::cout << "Aluno cadastrado com sucesso!\n";
                break;
            }
            case 2: {
                std::cout << "Lista de Alunos:\n";
                for (const Aluno& aluno : alunos) { // Percorre o vetor de alunos
                    std::cout << "Nome: " << aluno.nome << ", Idade: " << aluno.idade
                              << ", Nota: " << aluno.nota << "\n"; // Exibe as informa‡äes do aluno
                }
                break;
            }
            case 3:
                std::cout << "Encerrando o programa.\n";
                return 0; // Sai do programa
            default:
                std::cout << "Op‡Æo inv lida. Tente novamente.\n";
        }
    }

    return 0; // Retorna 0 para indicar que o programa foi executado com sucesso
}
