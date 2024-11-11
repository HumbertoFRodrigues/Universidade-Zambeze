#include <iostream>
#include <limits> // Para limpar o buffer do cin em caso de erro

int main() {
    char operador;
    double num1, num2;

    // Solicitar ao usu rio que insira o operador desejado (+, -, *, /)
    std::cout << "Calculadora Simples\n";
    std::cout << "Digite um operador (+, -, *, /): ";
    std::cin >> operador;

    // Validar o operador inserido
    if (operador != '+' && operador != '-' && operador != '*' && operador != '/') {
        std::cout << "Operador inv lido!" << std::endl;
        return 1; // Encerrar o programa com c¢digo de erro
    }

    // Solicitar ao usu rio que insira os dois n£meros
    std::cout << "Digite o primeiro n£mero: ";
    std::cin >> num1;

    // Verificar se o valor inserido ‚ um n£mero v lido
    if (!std::cin) {
        std::cout << "Valor inv lido para o primeiro n£mero." << std::endl;
        return 1;
    }

    std::cout << "Digite o segundo n£mero: ";
    std::cin >> num2;

    // Verificar se o valor inserido ‚ um n£mero v lido
    if (!std::cin) {
        std::cout << "Valor inv lido para o segundo n£mero." << std::endl;
        return 1;
    }

    // Limpar o buffer do cin para evitar problemas futuros
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

    // Realizar a opera‡Æo correspondente ao operador inserido
    switch (operador) {
        case '+':
            std::cout << "Resultado: " << num1 << " + " << num2 << " = " << num1 + num2 << std::endl;
            break;
        case '-':
            std::cout << "Resultado: " << num1 << " - " << num2 << " = " << num1 - num2 << std::endl;
            break;
        case '*':
            std::cout << "Resultado: " << num1 << " * " << num2 << " = " << num1 * num2 << std::endl;
            break;
        case '/':
            if (num2 != 0) {
                std::cout << "Resultado: " << num1 << " / " << num2 << " = " << num1 / num2 << std::endl;
            } else {
                std::cout << "NÆo ‚ poss¡vel dividir por zero." << std::endl;
            }
            break;
    }

    return 0;
}
