import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScopusService, Author } from '../../services/scopus.service';
import { Team, TeamMember, TeamService } from '../../services/team.service';

@Component({
  selector: 'app-team-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ team ? 'Modifier l\'équipe' : 'Créer une équipe' }}</h2>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Team name -->
          <div class="field-group">
            <label class="field-label">Nom de l'équipe</label>
            <input
              class="field-input"
              [(ngModel)]="teamName"
              placeholder="Ex : Équipe IA & Data Science"
              maxlength="80">
          </div>

          <!-- Member search -->
          <div class="field-group">
            <label class="field-label">Ajouter un membre</label>
            <div class="search-row">
              <input class="field-input" [(ngModel)]="searchFirst" placeholder="Prénom" (keyup.enter)="searchMembers()">
              <input class="field-input" [(ngModel)]="searchLast" placeholder="Nom" (keyup.enter)="searchMembers()">
              <button class="search-btn" (click)="searchMembers()" [disabled]="searchLoading">
                {{ searchLoading ? '...' : 'Rechercher' }}
              </button>
            </div>
            <div class="search-error" *ngIf="searchError">{{ searchError }}</div>
          </div>

          <!-- Search results -->
          <div class="search-results" *ngIf="searchResults.length > 0">
            <div class="results-label">Résultats :</div>
            <div *ngFor="let a of searchResults" class="result-item">
              <div class="result-info">
                <span class="result-name">{{ a.fullName }}</span>
                <span class="result-affil">{{ a.affiliation || 'Mohammed V University' }}</span>
              </div>
              <button class="add-btn"
                      (click)="addMember(a)"
                      [disabled]="isMemberAdded(a.authorId)"
                      [title]="isMemberAdded(a.authorId) ? 'Déjà ajouté' : 'Ajouter'">
                {{ isMemberAdded(a.authorId) ? '✓' : '+' }}
              </button>
            </div>
          </div>

          <!-- Current members -->
          <div class="members-section" *ngIf="members.length > 0">
            <label class="field-label">Membres ({{ members.length }})</label>
            <div *ngFor="let m of members; let i = index" class="member-item">
              <span class="member-name">{{ m.fullName }}</span>
              <button class="remove-btn" (click)="removeMember(i)" title="Retirer">✕</button>
            </div>
          </div>

          <div class="no-members" *ngIf="members.length === 0">
            Aucun membre ajouté. Recherchez des auteurs ci-dessus.
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" (click)="close.emit()">Annuler</button>
          <button class="save-btn" (click)="saveTeam()" [disabled]="!teamName.trim()">
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal-box {
      background: white;
      border-radius: 10px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #eee;
    }
    .modal-title {
      font-size: 18px;
      font-weight: 700;
      color: #1b4986;
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #999;
      line-height: 1;
      padding: 0 4px;
    }
    .close-btn:hover { color: #333; }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .field-group { display: flex; flex-direction: column; gap: 8px; }
    .field-label {
      font-size: 12px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .field-input {
      padding: 9px 12px;
      border: 1px solid #d0dff5;
      border-radius: 5px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
    }
    .field-input:focus { border-color: #1b4986; }

    .search-row {
      display: flex;
      gap: 8px;
    }
    .search-row .field-input { flex: 1; }
    .search-btn {
      background: #1b4986;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 9px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .search-btn:not(:disabled):hover { background: #153d70; }
    .search-error { font-size: 13px; color: #c53030; }

    .search-results {
      background: #f9fafb;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .results-label {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      padding: 8px 12px;
      background: #edf2f7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .result-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-top: 1px solid #eee;
    }
    .result-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .result-name { font-size: 14px; font-weight: 600; color: #333; }
    .result-affil { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .add-btn {
      background: #1b4986;
      color: white;
      border: none;
      border-radius: 4px;
      width: 28px;
      height: 28px;
      font-size: 16px;
      cursor: pointer;
      flex-shrink: 0;
      margin-left: 8px;
    }
    .add-btn:disabled { background: #48bb78; cursor: default; }
    .add-btn:not(:disabled):hover { background: #153d70; }

    .members-section { display: flex; flex-direction: column; gap: 8px; }
    .member-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f0f5ff;
      border: 1px solid #d0dff5;
      border-radius: 5px;
    }
    .member-name { font-size: 14px; color: #1b4986; font-weight: 500; }
    .remove-btn {
      background: none;
      border: none;
      color: #c53030;
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
    }
    .remove-btn:hover { color: #9b2c2c; }

    .no-members {
      font-size: 13px;
      color: #999;
      text-align: center;
      padding: 12px;
      background: #fafafa;
      border-radius: 5px;
      border: 1px dashed #ddd;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid #eee;
    }
    .cancel-btn {
      background: none;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 9px 20px;
      font-size: 14px;
      cursor: pointer;
      color: #555;
    }
    .cancel-btn:hover { background: #f5f5f5; }
    .save-btn {
      background: #eb6c34;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 9px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .save-btn:not(:disabled):hover { background: #d15d2a; }
  `]
})
export class TeamModalComponent implements OnChanges {
  @Input() team: Team | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Team>();

  teamName = '';
  members: TeamMember[] = [];
  searchFirst = '';
  searchLast = '';
  searchResults: Author[] = [];
  searchLoading = false;
  searchError = '';

  constructor(private scopusService: ScopusService, private teamService: TeamService) {}

  ngOnChanges(): void {
    if (this.team) {
      this.teamName = this.team.name;
      this.members = [...this.team.members];
    } else {
      this.teamName = '';
      this.members = [];
    }
    this.searchResults = [];
    this.searchFirst = '';
    this.searchLast = '';
    this.searchError = '';
  }

  async searchMembers(): Promise<void> {
    if (!this.searchFirst.trim() && !this.searchLast.trim()) return;
    this.searchLoading = true;
    this.searchError = '';
    this.searchResults = [];
    try {
      const res = await this.scopusService.searchAuthors(this.searchFirst, this.searchLast);
      this.searchResults = res.authors;
      if (res.authors.length === 0) this.searchError = 'Aucun auteur trouvé.';
    } catch (e: any) {
      this.searchError = e.message || 'Erreur lors de la recherche.';
    } finally {
      this.searchLoading = false;
    }
  }

  addMember(author: Author): void {
    if (this.isMemberAdded(author.authorId)) return;
    this.members.push({
      authorId: author.authorId,
      fullName: author.fullName,
      surname: author.surname,
      givenName: author.givenName
    });
  }

  removeMember(index: number): void {
    this.members.splice(index, 1);
  }

  isMemberAdded(authorId: string): boolean {
    return this.members.some(m => m.authorId === authorId);
  }

  saveTeam(): void {
    if (!this.teamName.trim()) return;
    const team: Team = {
      id: this.team?.id || this.teamService.newId(),
      name: this.teamName.trim(),
      members: this.members
    };
    this.save.emit(team);
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}
