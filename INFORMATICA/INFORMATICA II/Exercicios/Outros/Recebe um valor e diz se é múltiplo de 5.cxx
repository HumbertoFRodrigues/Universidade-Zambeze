#include<stdio.h>
#include<locale.h> 

int main() {

int x;

setlocale(LC_ALL,"portuguese");

printf("Digite o valor de x:");
scanf("%d",&x);

if(x % 5==0) 
 {
    printf("O número %d é múltiplo de 5",x);
  } else

  printf("\n O número %d não é múltiplo de 5");
return 0;
}