document.addEventListener("DOMContentLoaded", () => {
  /* ========================================= */
  /* Módulo de Gerenciamento do Carrossel */
  /* ========================================= */
  const Carousel = (carouselSelector) => {
    const carousel = document.querySelector(carouselSelector)
    if (!carousel) return // Se o carrossel não existe, pare a execução.

    const track = carousel.querySelector(".live-games-track")
    const prevBtn = carousel.querySelector(".prev")
    const nextBtn = carousel.querySelector(".next")
    const cards = Array.from(track.children)
    const cardWidth = cards[0].offsetWidth + 15 // Largura do card + gap

    const updateNavButtons = () => {
      const currentScroll = track.scrollLeft
      const maxScroll = track.scrollWidth - track.offsetWidth

      prevBtn.style.display = currentScroll > 0 ? "block" : "none"
      nextBtn.style.display = currentScroll < maxScroll - 1 ? "block" : "none"
    }

    const init = () => {
      if (cards.length > 0) {
        // Navegação com os botões
        prevBtn.addEventListener("click", () => track.scrollBy({ left: -cardWidth * 2, behavior: "smooth" }))
        nextBtn.addEventListener("click", () => track.scrollBy({ left: cardWidth * 2, behavior: "smooth" }))

        // Atualizar botões em caso de rolagem manual
        track.addEventListener("scroll", updateNavButtons)

        updateNavButtons() // Chamada inicial para mostrar/ocultar botões
      }
    }

    return { init }
  }

  /* ========================================= */
  /* Módulo de Gerenciamento do Ticket de Aposta */
  /* ========================================= */
  const BetSlipManager = () => {
    const gamesContainer = document.getElementById("games-container")
    const betList = document.getElementById("bet-list")
    const stakeInput = document.getElementById("stake-input")
    const totalOddsValue = document.getElementById("total-odds-value")
    const potentialReturnValue = document.getElementById("potential-return-value")
    const placeBetButton = document.getElementById("place-bet-button")

    let selectedBets = []

    const updateBetSlipUI = () => {
      betList.innerHTML = ""
      let totalOdds = 1

      if (selectedBets.length === 0) {
        betList.innerHTML = '<li class="empty-slip">Nenhuma aposta selecionada.</li>'
        placeBetButton.disabled = true
        totalOddsValue.textContent = "1.00"
        potentialReturnValue.textContent = "0.00"
        return
      }

      selectedBets.forEach((bet) => {
        const listItem = document.createElement("li")
        listItem.innerHTML = `
                    <span>${bet.team} - ${bet.odd.toFixed(2)}</span>
                    <button class="remove-bet" data-game-id="${bet.gameId}"><i class="fas fa-times"></i></button>
                `
        betList.appendChild(listItem)
        totalOdds *= bet.odd
      })

      const stake = Number.parseFloat(stakeInput.value) || 0
      const potentialReturn = stake * totalOdds

      totalOddsValue.textContent = totalOdds.toFixed(2)
      potentialReturnValue.textContent = potentialReturn.toFixed(2)
      placeBetButton.disabled = false
    }

    const handleGameSelection = (e) => {
      const button = e.target.closest(".odd-button")
      if (!button) return

      const gameCard = button.closest(".game-card")
      const gameId = gameCard.dataset.gameId || `game-${Math.random().toString(16).slice(2)}`
      gameCard.dataset.gameId = gameId

      const team = button.textContent.split("(")[0].trim()
      const odd = Number.parseFloat(button.dataset.odd)

      // Remove a seleção anterior do mesmo jogo, se houver
      selectedBets = selectedBets.filter((bet) => bet.gameId !== gameId)
      gameCard.querySelectorAll(".odd-button").forEach((btn) => btn.classList.remove("selected"))

      // Adiciona a nova aposta e a classe 'selected'
      selectedBets.push({ gameId, team, odd })
      button.classList.add("selected")

      updateBetSlipUI()
    }

    const handleBetRemoval = (e) => {
      const removeButton = e.target.closest(".remove-bet")
      if (!removeButton) return

      const gameIdToRemove = removeButton.dataset.gameId
      selectedBets = selectedBets.filter((bet) => bet.gameId !== gameIdToRemove)

      const gameCard = document.querySelector(`[data-game-id="${gameIdToRemove}"]`)
      if (gameCard) {
        gameCard.querySelectorAll(".odd-button").forEach((btn) => btn.classList.remove("selected"))
      }

      updateBetSlipUI()
    }

    const handlePlaceBet = () => {
      if (selectedBets.length === 0) return

      alert(`Aposta realizada com sucesso! Retorno Potencial: R$${potentialReturnValue.textContent}`)

      // Limpa o ticket e a seleção dos botões
      selectedBets = []
      document.querySelectorAll(".odd-button").forEach((btn) => btn.classList.remove("selected"))
      updateBetSlipUI()
    }

    const init = () => {
      // Delegação de eventos para melhor performance
      gamesContainer.addEventListener("click", handleGameSelection)
      betList.addEventListener("click", handleBetRemoval)
      placeBetButton.addEventListener("click", handlePlaceBet)
      stakeInput.addEventListener("input", updateBetSlipUI)

      updateBetSlipUI()
    }

    return { init }
  }

  // Inicializa os módulos
  const liveGamesCarousel = Carousel(".live-games-carousel")
  liveGamesCarousel.init()

  const betSlip = BetSlipManager()
  betSlip.init()
})
