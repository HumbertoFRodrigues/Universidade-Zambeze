#include<stdio.h> 
#include<locale.h>
int main() { 

int horas,minutos;

setlocale(LC_ALL,"portuguese");

printf("Qual a hora atual (formato 24) \n"); 
scanf("%d",&horas); 
minutos=(horas*60); 
printf("Desde o início do dia até a hora informada já se passaram %.d minutos \n", minutos); 
return 0;
}