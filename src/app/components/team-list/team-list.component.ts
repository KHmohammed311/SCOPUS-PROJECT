import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../services/team.service';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="team-list-container">
      <div class="tl-header">
        <div class="tl-header-left">
          <h2 class="tl-title">Mes équipes</h2>
          <span class="tl-count" *ngIf="teams.length > 0">{{ teams.length }} équipe{{ teams.length !== 1 ? 's' : '' }}</span>
        </div>
        <button class="create-btn" (click)="createTeam.emit()">+ Créer une équipe</button>
      </div>

      <div class="tl-empty" *ngIf="teams.length === 0">
        <div class="empty-icon">👥</div>
        <p>Aucune équipe pour le moment.</p>
        <button class="create-btn" (click)="createTeam.emit()">Créer ma première équipe</button>
      </div>

      <div class="tl-grid" *ngIf="teams.length > 0">
        <div *ngFor="let team of teams" class="team-card">
          <div class="team-card-header">
            <h3 class="team-name">{{ team.name }}</h3>
            <span class="member-badge">{{ team.members.length }} membre{{ team.members.length !== 1 ? 's' : '' }}</span>
          </div>

          <div class="member-list">
            <div *ngFor="let m of team.members.slice(0, 4)" class="member-chip">{{ m.fullName }}</div>
            <div *ngIf="team.members.length > 4" class="member-chip more-chip">
              +{{ team.members.length - 4 }} autre{{ team.members.length - 4 !== 1 ? 's' : '' }}
            </div>
          </div>

          <div class="team-actions">
            <button class="action-btn view-btn" (click)="viewTeam.emit(team)">
              Voir les publications
            </button>
            <button class="action-btn edit-btn" (click)="editTeam.emit(team)" title="Modifier">✏️</button>
            <button class="action-btn delete-btn" (click)="confirmDelete(team)" title="Supprimer">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .team-list-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 0;
    }
    .tl-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .tl-header-left { display: flex; align-items: baseline; gap: 10px; }
    .tl-title {
      font-size: 24px;
      font-weight: 700;
      color: #1b4986;
      margin: 0;
    }
    .tl-count {
      font-size: 14px;
      color: #888;
    }
    .create-btn {
      background: #eb6c34;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .create-btn:hover { background: #d15d2a; }

    .tl-empty {
      text-align: center;
      padding: 60px 24px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .tl-empty p { color: #666; margin-bottom: 20px; }

    .tl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .team-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: box-shadow 0.2s;
    }
    .team-card:hover { box-shadow: 0 4px 16px rgba(27,73,134,0.12); }

    .team-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .team-name {
      font-size: 16px;
      font-weight: 700;
      color: #1b4986;
      margin: 0;
      line-height: 1.3;
    }
    .member-badge {
      background: #e8f0fe;
      color: #1b4986;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 10px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .member-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .member-chip {
      background: #f0f4fa;
      color: #444;
      font-size: 12px;
      padding: 3px 9px;
      border-radius: 10px;
    }
    .more-chip {
      background: #e2e8f0;
      color: #666;
    }

    .team-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: auto;
    }
    .action-btn {
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.15s;
    }
    .view-btn {
      background: #1b4986;
      color: white;
      padding: 8px 14px;
      flex: 1;
    }
    .view-btn:hover { background: #153d70; }
    .edit-btn, .delete-btn {
      background: #f5f5f5;
      padding: 8px 10px;
      font-size: 15px;
    }
    .edit-btn:hover { background: #e8f0fe; }
    .delete-btn:hover { background: #fee2e2; }
  `]
})
export class TeamListComponent {
  @Input() teams: Team[] = [];
  @Output() createTeam = new EventEmitter<void>();
  @Output() editTeam = new EventEmitter<Team>();
  @Output() deleteTeam = new EventEmitter<string>();
  @Output() viewTeam = new EventEmitter<Team>();

  confirmDelete(team: Team): void {
    if (confirm(`Supprimer l'équipe "${team.name}" ?`)) {
      this.deleteTeam.emit(team.id);
    }
  }
}
