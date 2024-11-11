#include <iostream>
#include <string>
#include <cctype> // Para a função tolower

bool isPalindromo(const std::string& texto) {
    int esquerda = 0;
    int direita = texto.length() - 1;

    while (esquerda < direita) {
        // Ignora espaços e converte caracteres para minúsculas antes de comparar
        while (esquerda < direita && !isalnum(texto[esquerda])) {
            esquerda++;
        }
        while (esquerda < direita && !isalnum(texto[direita])) {
            direita--;
        }

        // Compara os caracteres
        if (tolower(texto[esquerda]) != tolower(texto[direita])) {
            return false; // Não é um palíndromo
        }

        esquerda++;
        direita--;
    }

    return true; // É um palíndromo
}

int main() {
    std::string texto;
    std::cout << "Digite um texto para verificar se e um palindromo: ";
    std::getline(std::cin, texto);

    if (isPalindromo(texto)) {
        std::cout << "E um palindromo!" << std::endl;
    } else {
        std::cout << "Nao e um palindromo!" << std::endl;
    }

    return 0;
}

/*
Um palíndromo é uma palavra, frase, número ou outra sequência de caracteres que permanece a mesma quando lida da esquerda para a direita e da direita para a esquerda. 

Neste código, a função isPalindromo recebe uma string como entrada e verifica se ela é um palíndromo. Ela ignora espaços e diferencia maiúsculas de minúsculas ao comparar os caracteres. A função retorna true se o texto for um palíndromo e false caso contrário.

No main(), o programa solicita que você insira um texto e, em seguida, usa a função isPalindromo para verificar se é um palíndromo. O resultado é exibido na tela.
*/