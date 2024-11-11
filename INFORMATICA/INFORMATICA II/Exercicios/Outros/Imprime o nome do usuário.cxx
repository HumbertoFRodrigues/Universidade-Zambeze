#include<stdio.h>
int main()
{
    char nome[30];
    printf("Informe seu nome: ");
    fgets(nome, sizeof(nome), stdin);  
    printf("----- Nome Digitado: ");
    puts(nome);  
    return 0;
}