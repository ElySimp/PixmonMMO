# Vercel Test Script
# This script helps you test your Vercel deployment locally

# Colors
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"
BOLD="\033[1m"

echo -e "${BOLD}${CYAN}"
echo "╔═════════════════════════════════════════════════════════════╗"
echo "║  VERCEL LOCAL TESTING TOOL                                  ║"
echo "║  Choose how you want to test your Vercel project locally    ║"
echo "╚═════════════════════════════════════════════════════════════╝${RESET}"
echo ""

echo -e "${BOLD}Choose a testing method:${RESET}"
echo ""
echo -e "  ${BOLD}1.${RESET} ${GREEN}Express-based local production server${RESET}"
echo "     Simulates Vercel production using Express"
echo "     Doesn't require Vercel CLI"
echo "     Faster startup but less accurate"
echo ""
echo -e "  ${BOLD}2.${RESET} ${BLUE}Vercel CLI development server${RESET}"
echo "     Uses official Vercel CLI 'vercel dev' command"
echo "     More accurate simulation of production"
echo "     Requires Vercel CLI and login"
echo ""
echo -e "  ${BOLD}3.${RESET} ${MAGENTA}Create Vercel preview deployment${RESET}"
echo "     Creates an actual deployment preview URL"
echo "     Most accurate testing environment"
echo "     Does not affect production"
echo ""

read -p "Enter your choice (1/2/3): " choice

case $choice in
  1)
    echo -e "\n${YELLOW}Starting Express-based local production server...${RESET}\n"
    node local-production-test.js
    ;;
  2)
    echo -e "\n${YELLOW}Starting Vercel development server...${RESET}\n"
    node vercel-dev.js
    ;;
  3)
    echo -e "\n${YELLOW}Creating Vercel preview deployment...${RESET}\n"
    vercel
    ;;
  *)
    echo -e "\n${YELLOW}Invalid choice. Please run the script again.${RESET}\n"
    exit 1
    ;;
esac
