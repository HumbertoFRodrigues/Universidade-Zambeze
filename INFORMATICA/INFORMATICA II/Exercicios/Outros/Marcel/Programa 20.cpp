#include <iostream>
using namespace std;
int main(){
	//Media com percemtagem
	int t1, t2, media;
	cout << "Digite o valor do Teste 1: ";
	cin >> t1;
	cout << "Digite o valor do Teste 2: ";
	cin >> t2;
	media = (t1*40)/100+(t2*60)/100;
	if (media < 10){
		cout << "A media e igual a: " <<media;
		cout << "\nSituacao final: Excluido";
	} else{
		if(9 < media < 14) {
	    cout << "A media e igual a: " <<media;
		cout << "\nSituacao final: Admite";
        }else ( media > 13);{
			cout << "A media e igual a: " <<media;
		cout << "\nSituacao final: DISPENSA";
		} 	
	}	
return 0;
}
