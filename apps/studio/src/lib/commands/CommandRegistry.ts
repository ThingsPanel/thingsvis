/**
 * Command Registry
 * 
 * Singleton registry for keyboard shortcuts and command management.
 * Provides command registration, execution, and lookup functionality.
 */

import type { Command, CommandCategory, ICommandRegistry } from './types'

// =============================================================================
// Command Registry Implementation
// =============================================================================

class CommandRegistryImpl implements ICommandRegistry {
  private commands = new Map<string, Command>()
  private listeners = new Set<() => void>()

  /**
   * Register a command.
   * Throws if command with same ID already exists.
   */
  register(command: Command): void {
    if (this.commands.has(command.id)) {
      throw new Error(`Command "${command.id}" is already registered`)
    }
    this.commands.set(command.id, command)
    this.notify()
  }

  /**
   * Register multiple commands at once.
   */
  registerAll(commands: Command[]): void {
    for (const command of commands) {
      if (this.commands.has(command.id)) {
        
        continue
      }
      this.commands.set(command.id, command)
    }
    this.notify()
  }

  /**
   * Unregister a command by ID.
   */
  unregister(id: string): void {
    if (this.commands.delete(id)) {
      this.notify()
    }
  }

  /**
   * Execute a command by ID.
   * Does nothing if command not found or disabled.
   */
  async execute(id: string): Promise<void> {
    const command = this.commands.get(id)
    if (!command) {
      
      return
    }

    if (!this.isEnabled(id)) {
      return
    }

    try {
      await command.execute()
    } catch (error) {
      
    }
  }

  /**
   * Get command by ID.
   */
  get(id: string): Command | undefined {
    return this.commands.get(id)
  }

  /**
   * Get all registered commands.
   */
  getAll(): Command[] {
    return Array.from(this.commands.values())
  }

  /**
   * Get commands filtered by category.
   */
  getByCategory(category: CommandCategory): Command[] {
    return this.getAll().filter(cmd => cmd.category === category)
  }

  /**
   * Check if a command is enabled.
   */
  isEnabled(id: string): boolean {
    const command = this.commands.get(id)
    if (!command) return false
    if (!command.when) return true
    return command.when()
  }

  /**
   * Subscribe to command registry changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all subscribers of changes.
   */
  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (error) {
        
      }
    }
  }

  /**
   * Clear all registered commands (useful for testing).
   */
  clear(): void {
    this.commands.clear()
    this.notify()
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const commandRegistry = new CommandRegistryImpl()

// Also export the class for testing
export { CommandRegistryImpl }
