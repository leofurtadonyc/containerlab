#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

clear
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}      GERENCIADOR DE LAB - VITOR SA        ${NC}"
echo -e "${BLUE}===========================================${NC}"

# 1. Selecionar a Ação
echo ""
echo -e "\nO que você deseja fazer?"
echo "1) Deploy (Subir o Lab)"
echo "2) Destroy (Destruir o Lab)"
echo "3) Graph (Gerar Draw.io / Visualizar)"
echo ""
read -p "Escolha uma opção (1, 2 ou 3): " OPCAO

# 2. Selecionar o Arquivo .yaml dinamicamente
echo ""
echo -e "\n${BLUE}Arquivos de topologia encontrados:${NC}"

# Criar um array com os arquivos .yaml
echo ""
FILES=( *.yaml )

# Listar os arquivos com números
for i in "${!FILES[@]}"; do
  echo "$((i+1))) ${FILES[$i]}"
done

echo ""
read -p "Escolha o número do arquivo: " FILE_NUM

# Validar a escolha do arquivo
ARQUIVO="${FILES[$((FILE_NUM-1))]}"

if [[ -z "$ARQUIVO" ]]; then
    echo -e "${RED}Erro: Opção de arquivo inválida!${NC}"
    exit 1
fi

case $OPCAO in
    1)
        echo -e "\n${GREEN}[1/3] Limpando Cache de RAM (Comando Mestre)...${NC}"
        sudo sh -c "sync; echo 3 > /proc/sys/vm/drop_caches"
        echo -e "${GREEN}[2/3] Definindo Timeout para o Swap...${NC}"
        export CLAB_POST_DEPLOY_TIMEOUT=600s
        echo -e "${GREEN}[3/3] Iniciando Deploy de $ARQUIVO...${NC}"
        # --max-workers 1 é essencial para seus 16GB atuais!
        sudo -E containerlab deploy -t "$ARQUIVO" --max-workers 1
        ;;
    2)
        echo -e "\n${RED}[!] Destruindo Lab e limpando arquivos de rede...${NC}"
        sudo -E containerlab destroy -t "$ARQUIVO" --cleanup
        sudo sh -c "sync; echo 3 > /proc/sys/vm/drop_caches"
        echo -e "${GREEN}Concluído!${NC}"
        ;;
    3)
        echo -e "\n${YELLOW}[+] Gerando arquivo Draw.io de $ARQUIVO...${NC}"
        sudo containerlab graph -t "$ARQUIVO" --drawio
        echo -e "${GREEN}Sucesso! O arquivo .drawio foi gerado na pasta.${NC}"
        ;;
    *)
        echo -e "${RED}Opção inválida!${NC}"
        ;;
esac