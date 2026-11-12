import type { Game } from './game'
import { Role } from './role'

export class Player {
  game: Game
  role: Role
  position: number
  hasOperated = false

  constructor(roleName: string, position: number, game: Game) {
    this.game = game
    this.role = new Role(roleName, game)
    this.position = position
  }
}
