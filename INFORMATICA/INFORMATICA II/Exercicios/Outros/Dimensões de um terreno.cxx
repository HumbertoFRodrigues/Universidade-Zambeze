#include<stdio.h> 
#include<locale.h>

int main()  {

float area, comprimento, largura;
setlocale(LC_ALL,"portuguese");

printf("Digite o valor do comprimento(em metros): ");
scanf("%f",&comprimento);
printf("Digite o valor da largura(em metros): ");
scanf("%f",&largura);

area=comprimento*largura;
printf("O terreno possui %.1f metros quadrados de área",area);

return 0;
}