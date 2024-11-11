#include<stdio.h> 
int main() {

 float salario_min, salario_pessoa, qtd_sal_min;

printf ("Informe o valor do salario minimo e \n MT ");
scanf("%f",&salario_min); 

printf("Informe o valor do salario recebido pela pessoa \n MT ");
scanf("%f",&salario_pessoa); 

qtd_sal_min=(salario_pessoa/salario_min); 

printf("Uma pessoa que recebe um salario de MT %.2f reais recebe %.1f salarios minimos \n", salario_pessoa,qtd_sal_min); 

return 0;
}