#include <iostream>
#include <string>
#include <sstream>
#include <bitset>

// Funá∆o para converter decimal para bin†rio
std::string decimalToBinary(int decimal) {
    return std::bitset<8>(decimal).to_string(); // Usa a classe std::bitset para realizar a convers∆o
}

// Funá∆o para converter decimal para hexadecimal
std::string decimalToHexadecimal(int decimal) {
    std::stringstream ss;
    ss << std::hex << decimal; // Usa a formataá∆o hexadecimal da stream para converter
    return ss.str();
}

int main() {
    int numero;
    std::string opcao;

    std::cout << "Conversor de Bases Numericas\n";
    std::cout << "Digite um numero decimal: ";
    std::cin >> numero;

    std::cout << "Escolha a base de conversao (bin, hex): ";
    std::cin >> opcao;

    if (opcao == "bin") {
        std::string binario = decimalToBinary(numero);
        std::cout << "Resultado: " << binario << " (binario)" << std::endl; // Exibe o resultado em bin†rio
    } else if (opcao == "hex") {
        std::string hexadecimal = decimalToHexadecimal(numero);
        std::cout << "Resultado: " << hexadecimal << " (hexadecimal)" << std::endl; // Exibe o resultado em hexadecimal
    } else {
        std::cout << "Opcao invalida." << std::endl; // Trata opá‰es inv†lidas
    }

    return 0; // Indica que o programa foi executado com sucesso
}
