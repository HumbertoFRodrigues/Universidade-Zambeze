#include<iostream>
#include<cstdlib>
using namespace std;

typedef struct material{
	string name;
	int codigo;
	float data;
}Material;
int smss(int &a, int *b, int s);
void menu();
void ler(Material &m);
Material ler1();
void imprimirUm(Material m);
void addmaterial(Material materials[],int &qtd,Material novoMaterial);
void imprimirTodos(Material materials[],int qtd);
void cadastrarMaterial(Material materials[], int& qtd);
int main(){
	int opcao;
	int qtd=0, r=10;
	Material materials[5];
	while(true){
		Material novoMaterial;
		menu();
		cin>>opcao;
		switch(opcao){
			case 1:
			//	cadastrarMaterial(materials, qtd);
			//	Material novo;
				novoMaterial=ler1();
				//ler(novoMaterial);
				imprimirUm(novoMaterial);
			//	addmaterial(materials, qtd, novoMaterial);
				break;
			case 2:
				imprimirTodos(materials, qtd);
			    break;
		    default: 
		        cout<<"Fim...";		
		}
	}
	/*
	cout<<"teste..";
	int a=10, b=11,s=12;
	cout<<"\na:"<<a<<", b:"<<b<<",s:"<<s;
	smss(a, &b,s);
	cout<<"\na:"<<a<<", b:"<<b<<",s:"<<s;*/
	return 0;
}
void addmaterial(Material materials[],int &qtd,Material novoMaterial){
		materials[qtd]=novoMaterial;
		qtd++;
}
int smss(int &a, int *b, int s){
	s=0;
	*b=0;
	a=0;
	return 0;
}
void ler(Material &m){

        cout<<"Digite o codigo do material: ";
        cin>>m.codigo;
        cout<<"Digite a data do material: ";
        cin>>m.data;
        cout<<"Digite o nome do material: ";
        cin>>m.name;
        
   // return m;
}
Material ler1(){
	Material m;
        cout<<"Digite o codigo do material: ";
        cin>>m.codigo;
        cout<<"Digite a data do material: ";
        cin>>m.data;
        cout<<"Digite o nome do material: ";
        cin>>m.name;
        
    return m;
}
void imprimirUm(Material m){
	cout<<"{O nome : "<<m.name<<endl;
	cout<<"O codigo: "<<m.codigo<<endl;
	cout<<"A data: "<<m.data<<endl;
	cout<<"},";
}
void imprimirTodos(Material materials[],int qtd){
	cout<<"\n[";
	for(int i=0; i<qtd; i++){
		imprimirUm(materials[i]);
	}
	cout<<"]\n\n\n\n";
}
void menu(){
	cout<<"\t\tMenu"<<endl;
	cout<<"1 - para cadastrar o material"<<endl;
	cout<<"2 - para listar os materiais"<<endl;
	cout<<"3 - para eliminar um material"<<endl;
	cout<<"5 - para editar"<<endl;
	cout<<endl;
	cout<<"Escolha a opcao que desejas: ";
}
void cadastrarMaterial(Material materials[], int& qtd){
    int numMateriais;
    cout<<"Quantos materiais desejas cadastrar? ";
    cin>>numMateriais;
    for(int i = 0; i < numMateriais; i++){
        cout<<"Digite o nome do material: ";
        cin>>materials[qtd].name;
        cout<<"Digite o codigo do material: ";
        cin>>materials[qtd].codigo;
        cout<<"Digite a data do material: ";
        cin>>materials[qtd].data;
        qtd++;
        system("cls"); //limpar a tela
    }
}
