#include <iostream>
#include <string>
#include <cstdlib>
#include <ctime>

// Fun‡Æo para gerar uma senha aleat¢ria
std::string generatePassword(int length, bool includeUppercase, bool includeDigits, bool includeSpecialChars) {
    const std::string lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const std::string uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const std::string digitChars = "0123456789";
    const std::string specialChars = "!@#$%^&*()_+{}[]";

    std::string allChars = lowercaseChars;

    if (includeUppercase) {
        allChars += uppercaseChars;
    }
    if (includeDigits) {
        allChars += digitChars;
    }
    if (includeSpecialChars) {
        allChars += specialChars;
    }

    std::string password;
    srand(time(0)); // Inicializa a semente do gerador de n£meros aleat¢rios

    for (int i = 0; i < length; ++i) {
        int randomIndex = rand() % allChars.length();
        password += allChars[randomIndex];
    }

    return password;
}

int main() {
    int length;
    bool includeUppercase, includeDigits, includeSpecialChars;

    std::cout << "----- Gerador de Senhas Aleatorias -----\n\n";
    std::cout << "Digite o tamanho da senha: ";
    std::cin >> length;

    std::cout << "Incluir letras maiusculas? (0/1): ";
    std::cin >> includeUppercase;

    std::cout << "Incluir digitos? (0/1): ";
    std::cin >> includeDigits;

    std::cout << "Incluir caracteres especiais? (0/1): ";
    std::cin >> includeSpecialChars;

    std::string senha = generatePassword(length, includeUppercase, includeDigits, includeSpecialChars);

    std::cout << "Senha gerada: " << senha << std::endl;

    return 0;
}
