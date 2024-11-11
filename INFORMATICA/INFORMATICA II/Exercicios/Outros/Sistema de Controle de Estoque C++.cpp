#include <iostream>a
#include <vector>
#include <fstream>
#include <string>

class Produto {
public:
    int id;
    std::string nome;
    float preco;
    int quantidade;

    Produto(int id, const std::string& nome, float preco, int quantidade)
        : id(id), nome(nome), preco(preco), quantidade(quantidade) {}
};

class ControleEstoque {
private:
    std::vector<Produto> estoque;
    int proximo_id = 1;

public:
    void cadastrarProduto() {
        std::string nome;
        float preco;
        int quantidade;

        std::cout << "Nome do produto: ";
        std::getline(std::cin >> std::ws, nome);
        std::cout << "Preco do produto: ";
        std::cin >> preco;
        std::cout << "Quantidade do produto: ";
        std::cin >> quantidade;

        Produto novo_produto(proximo_id++, nome, preco, quantidade);
        estoque.push_back(novo_produto);

        std::cout << "Produto cadastrado com sucesso! ID do produto: " << novo_produto.id << "\n";
    }

    void listarProdutos() const {
        if (estoque.empty()) {
            std::cout << "Nenhum produto cadastrado.\n";
            return;
        }

        std::cout << "Lista de Produtos:\n";
        for (const auto& produto : estoque) {
            std::cout << "ID: " << produto.id << ", Nome: " << produto.nome
                      << ", Preço: " << produto.preco << ", Quantidade: " << produto.quantidade << "\n";
        }
    }

    void atualizarProduto() {
        int id;
        std::cout << "Informe o ID do produto que deseja atualizar: ";
        std::cin >> id;

        for (auto& produto : estoque) {
            if (produto.id == id) {
                std::cout << "Novo nome: ";
                std::getline(std::cin >> std::ws, produto.nome);
                std::cout << "Novo preço: ";
                std::cin >> produto.preco;
                std::cout << "Nova quantidade: ";
                std::cin >> produto.quantidade;

                std::cout << "Produto atualizado com sucesso!\n";
                return;
            }
        }
        std::cout << "Produto com ID " << id << " não encontrado.\n";
    }

    void excluirProduto() {
        int id;
        std::cout << "Informe o ID do produto que deseja excluir: ";
        std::cin >> id;

        for (auto it = estoque.begin(); it != estoque.end(); ++it) {
            if (it->id == id) {
                estoque.erase(it);
                std::cout << "Produto excluído com sucesso!\n";
                return;
            }
        }
        std::cout << "Produto com ID " << id << " não encontrado.\n";
    }

    void salvarEmArquivo() const {
        std::ofstream arquivo("estoque.dat", std::ios::binary);
        if (!arquivo) {
            std::cout << "Erro ao abrir o arquivo.\n";
            return;
        }

        int total_produtos = estoque.size();
        arquivo.write(reinterpret_cast<const char*>(&total_produtos), sizeof(total_produtos));

        for (const auto& produto : estoque) {
            arquivo.write(reinterpret_cast<const char*>(&produto.id), sizeof(produto.id));
            int nome_size = produto.nome.size();
            arquivo.write(reinterpret_cast<const char*>(&nome_size), sizeof(nome_size));
            arquivo.write(produto.nome.c_str(), nome_size);
            arquivo.write(reinterpret_cast<const char*>(&produto.preco), sizeof(produto.preco));
            arquivo.write(reinterpret_cast<const char*>(&produto.quantidade), sizeof(produto.quantidade));
        }

        std::cout << "Dados salvos com sucesso!\n";
    }

    void carregarDoArquivo() {
        std::ifstream arquivo("estoque.dat", std::ios::binary);
        if (!arquivo) {
            std::cout << "Nenhum arquivo de dados encontrado. Iniciando estoque vazio.\n";
            return;
        }

        int total_produtos;
        arquivo.read(reinterpret_cast<char*>(&total_produtos), sizeof(total_produtos));

        estoque.clear();
        for (int i = 0; i < total_produtos; ++i) {
            int id, quantidade, nome_size;
            float preco;
            std::string nome;

            arquivo.read(reinterpret_cast<char*>(&id), sizeof(id));
            arquivo.read(reinterpret_cast<char*>(&nome_size), sizeof(nome_size));
            nome.resize(nome_size);
            arquivo.read(&nome[0], nome_size);
            arquivo.read(reinterpret_cast<char*>(&preco), sizeof(preco));
            arquivo.read(reinterpret_cast<char*>(&quantidade), sizeof(quantidade));

            estoque.emplace_back(id, nome, preco, quantidade);
            if (id >= proximo_id) proximo_id = id + 1;
        }

        std::cout << "Dados carregados com sucesso!\n";
    }

    void menu() {
        int opcao;
        do {
            std::cout << "\nControle de Estoque\n";
            std::cout << "1. Cadastrar Produto\n";
            std::cout << "2. Listar Produtos\n";
            std::cout << "3. Atualizar Produto\n";
            std::cout << "4. Excluir Produto\n";
            std::cout << "5. Salvar Dados\n";
            std::cout << "6. Carregar Dados\n";
            std::cout << "0. Sair\n";
            std::cout << "Escolha uma opcao: ";
            std::cin >> opcao;

            switch (opcao) {
                case 1:
                    cadastrarProduto();
                    break;
                case 2:
                    listarProdutos();
                    break;
                case 3:
                    atualizarProduto();
                    break;
                case 4:
                    excluirProduto();
                    break;
                case 5:
                    salvarEmArquivo();
                    break;
                case 6:
                    carregarDoArquivo();
                    break;
                case 0:
                    std::cout << "Saindo do sistema.\n";
                    break;
                default:
                    std::cout << "Opção inválida! Tente novamente.\n";
            }
        } while (opcao != 0);
    }
};

int main() {
    ControleEstoque controleEstoque;
    controleEstoque.carregarDoArquivo();  // Carregar dados ao iniciar o sistema
    controleEstoque.menu();               // Executar o menu interativo
    controleEstoque.salvarEmArquivo();    // Salvar dados ao sair do sistema
    return 0;
}