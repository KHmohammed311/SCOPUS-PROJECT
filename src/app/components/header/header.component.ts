import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="app-header">
      <div class="header-inner">
        <div class="header-text">
          <h1>Recherche de publications</h1>
          <p>Université Mohammed V de Rabat — Scopus</p>
        </div>
        <div class="header-actions">
          <button class="teams-btn" (click)="showTeams.emit()">👥 Mes équipes</button>
          <button class="create-team-btn" (click)="createTeam.emit()">+ Créer une équipe</button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background: linear-gradient(135deg, #1b4986 0%, #2c6fca 100%);
      color: white;
      padding: 0 20px;
      box-shadow: 0 2px 8px rgba(27,73,134,0.3);
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      gap: 16px;
      flex-wrap: wrap;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    p {
      font-size: 13px;
      margin: 0;
      opacity: 0.8;
    }
    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .teams-btn {
      background: rgba(255,255,255,0.15);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 5px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .teams-btn:hover { background: rgba(255,255,255,0.25); }
    .create-team-btn {
      background: #eb6c34;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .create-team-btn:hover { background: #d15d2a; }
  `]
})
export class HeaderComponent {
  @Output() showTeams = new EventEmitter<void>();
  @Output() createTeam = new EventEmitter<void>();
}
