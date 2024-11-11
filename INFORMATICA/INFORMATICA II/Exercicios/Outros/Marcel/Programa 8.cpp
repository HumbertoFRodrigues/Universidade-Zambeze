#include <iostream>
using namespace std;
int main(){
    //estruturas condicionais
    int baixa, matacuane, resposta;
    baixa=1;
    matacuane=2;
    cout << "Onde moras baixa ou matacuane?\n";
    cout << "Digite aqui a sua resposta. Note: se for baixa digite 1, matacuane 2: ";
    cin >> resposta;
    if(resposta==1){
    	cout << "Voce precisa pegar chapa para chegar na universidade atempadamente";
	}else if(resposta==2){
		cout << "voce pode caminhar";
	}
	 
	return 0;
}
