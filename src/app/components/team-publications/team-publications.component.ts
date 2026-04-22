import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScopusService, Publication, MemberStats } from '../../services/scopus.service';
import { Team } from '../../services/team.service';
import { SjrTimelineComponent } from '../sjr-timeline/sjr-timeline.component';

const ALL_TYPES = ['Article', 'Conference', 'Book Chapter', 'Review'];

@Component({
  selector: 'app-team-publications',
  standalone: true,
  imports: [CommonModule, FormsModule, SjrTimelineComponent],
  template: `
    <div class="tp-container">

      <!-- Loading -->
      <div class="tp-loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Récupération des publications de l'équipe... ({{ team.members.length }} membres)</p>
      </div>

      <!-- Error -->
      <div class="tp-error" *ngIf="!loading && error">{{ error }}</div>

      <!-- Results -->
      <div *ngIf="!loading && !error">

        <!-- Feature 3.3: Team Summary Card -->
        <div class="team-summary-card">
          <div class="ts-title-row">
            <span class="ts-team-label">Équipe : <strong>{{ team.name }}</strong></span>
            <span class="ts-member-count">{{ team.members.length }} membre{{ team.members.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="ts-divider"></div>
          <div class="ts-stats-row">
            <div class="ts-stat">
              <span class="ts-stat-value">{{ allPubs.length }}</span>
              <span class="ts-stat-label">Publications uniques</span>
            </div>
            <div class="ts-stat-breakdown">
              <span class="ts-chip ts-article" *ngIf="typeCount('Article') > 0">Articles : {{ typeCount('Article') }}</span>
              <span class="ts-chip ts-conf" *ngIf="typeCount('Conference') > 0">Conférences : {{ typeCount('Conference') }}</span>
              <span class="ts-chip ts-book" *ngIf="typeCount('Book Chapter') > 0">Book Chapters : {{ typeCount('Book Chapter') }}</span>
              <span class="ts-chip ts-review" *ngIf="typeCount('Review') > 0">Reviews : {{ typeCount('Review') }}</span>
            </div>
          </div>

          <div class="ts-contributors" *ngIf="topContributors.length > 0">
            <div class="ts-section-label">Top contributeurs :</div>
            <div *ngFor="let c of topContributors" class="ts-contributor">
              <span class="ts-contrib-name">{{ c.name }}</span>
              <span class="ts-contrib-stats">
                {{ c.total }} publication{{ c.total !== 1 ? 's' : '' }}
                ({{ c.firstAuthor }} en 1<sup>er</sup> auteur)
              </span>
            </div>
          </div>

          <div class="ts-years" *ngIf="yearRange">
            <span class="ts-section-label">Années d'activité :</span>
            <span class="ts-year-range">{{ yearRange }}</span>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-panel" *ngIf="allPubs.length > 0">
          <div class="filters-row">
            <div class="filter-group">
              <label class="filter-label">Rang auteur</label>
              <div class="btn-group">
                <button class="toggle-btn" [class.active]="filterRank === 'all'" (click)="filterRank = 'all'">Tous</button>
                <button class="toggle-btn" [class.active]="filterRank === '1'" (click)="filterRank = '1'">1<sup>er</sup></button>
                <button class="toggle-btn" [class.active]="filterRank === '2'" (click)="filterRank = '2'">2<sup>ème</sup></button>
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-label">Année</label>
              <select class="year-select" [(ngModel)]="filterYear">
                <option value="">Toutes</option>
                <option *ngFor="let y of availableYears" [value]="y">{{ y }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Type</label>
              <div class="type-checks">
                <label *ngFor="let t of pubTypes" class="check-label">
                  <input type="checkbox" [checked]="filterTypes.has(t)" (change)="toggleType(t)">
                  {{ t }}
                </label>
              </div>
            </div>
            <button class="reset-btn" (click)="resetFilters()" *ngIf="hasActiveFilters">Réinitialiser</button>
          </div>
        </div>

        <div class="results-banner" *ngIf="allPubs.length > 0">
          {{ filteredPubs.length }} publication{{ filteredPubs.length !== 1 ? 's' : '' }}
          <span *ngIf="hasActiveFilters"> (filtre actif)</span>
        </div>

        <div class="tp-empty" *ngIf="allPubs.length === 0">
          Aucune publication trouvée pour les membres de cette équipe.
        </div>

        <div class="tp-empty" *ngIf="allPubs.length > 0 && filteredPubs.length === 0">
          Aucune publication ne correspond aux filtres sélectionnés.
        </div>

        <!-- Publication cards -->
        <div *ngFor="let pub of filteredPubs" class="pub-card">
          <h3 class="pub-title">{{ pub.title }}</h3>
          <div class="pub-meta">
            <span class="pub-type" [ngClass]="getBadgeClass(pub.type)">{{ pub.type }}</span>
            <span class="pub-date">{{ pub.date || pub.year }}</span>
            <span class="pub-journal" *ngIf="pub.journal">{{ pub.journal }}</span>
            <span class="pub-cited" *ngIf="pub.cited > 0">Cités : {{ pub.cited }}</span>
          </div>
          <div class="pub-authors">
            <span class="authors-label">Auteurs : </span>{{ pub.authors }}<span *ngIf="pub.moreAuthors" class="more-authors">{{ pub.moreAuthors }}</span>
          </div>
          <div class="pub-extra" *ngIf="pub.volume || pub.issue || pub.pages">
            <span *ngIf="pub.volume">Vol. {{ pub.volume }}</span>
            <span *ngIf="pub.issue">No. {{ pub.issue }}</span>
            <span *ngIf="pub.pages">p. {{ pub.pages }}</span>
          </div>
          <a *ngIf="pub.doi" [href]="'https://doi.org/' + pub.doi" target="_blank" class="doi-link">
            DOI: {{ pub.doi }}
          </a>
          <app-sjr-timeline
            *ngIf="(pub.type === 'Article' || pub.type === 'Review') && (pub.issn || pub.eissn)"
            [issn]="pub.issn"
            [eissn]="pub.eissn"
            [year]="pub.year"
            [journalName]="pub.journal">
          </app-sjr-timeline>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .tp-container { padding: 24px 0; }

    .tp-loading {
      text-align: center;
      padding: 60px;
      color: #555;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: #1b4986;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .tp-error {
      background: #fee2e2;
      color: #991b1b;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .tp-empty {
      text-align: center;
      padding: 40px;
      color: #666;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      margin-bottom: 20px;
    }

    /* Team Summary Card */
    .team-summary-card {
      background: linear-gradient(135deg, #1b4986 0%, #2c6fca 100%);
      color: white;
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(27,73,134,0.3);
    }
    .ts-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ts-team-label { font-size: 18px; opacity: 0.9; }
    .ts-team-label strong { font-size: 20px; opacity: 1; }
    .ts-member-count {
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
    }
    .ts-divider {
      height: 1px;
      background: rgba(255,255,255,0.2);
      margin-bottom: 16px;
    }
    .ts-stats-row {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .ts-stat { display: flex; flex-direction: column; }
    .ts-stat-value { font-size: 36px; font-weight: 700; line-height: 1; }
    .ts-stat-label { font-size: 12px; opacity: 0.75; margin-top: 2px; }
    .ts-stat-breakdown { display: flex; gap: 8px; flex-wrap: wrap; }
    .ts-chip {
      padding: 4px 10px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }
    .ts-article { background: rgba(230,240,250,0.25); }
    .ts-conf { background: rgba(240,244,248,0.25); }
    .ts-book { background: rgba(238,248,236,0.25); }
    .ts-review { background: rgba(252,232,232,0.25); }
    .ts-contributors { margin-bottom: 14px; }
    .ts-section-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.7;
      margin-bottom: 8px;
      display: block;
    }
    .ts-contributor {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-wrap: wrap;
      gap: 8px;
    }
    .ts-contrib-name { font-weight: 600; font-size: 14px; }
    .ts-contrib-stats { font-size: 12px; opacity: 0.8; }
    .ts-years { display: flex; align-items: center; gap: 8px; }
    .ts-year-range { font-weight: 600; font-size: 15px; }

    /* Filters */
    .filters-panel {
      background: #f8fafd;
      border: 1px solid #e2eaf5;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .filters-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-end;
    }
    .filter-group { display: flex; flex-direction: column; gap: 6px; }
    .filter-label {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-group {
      display: flex;
      border: 1px solid #d0dff5;
      border-radius: 4px;
      overflow: hidden;
    }
    .toggle-btn {
      border: none;
      background: white;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      color: #555;
      transition: all 0.15s;
      border-right: 1px solid #d0dff5;
    }
    .toggle-btn:last-child { border-right: none; }
    .toggle-btn.active { background: #1b4986; color: white; }
    .year-select {
      padding: 6px 10px;
      border: 1px solid #d0dff5;
      border-radius: 4px;
      font-size: 13px;
      background: white;
      outline: none;
    }
    .type-checks { display: flex; gap: 12px; flex-wrap: wrap; }
    .check-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: #444;
      cursor: pointer;
    }
    .reset-btn {
      align-self: flex-end;
      background: none;
      border: 1px solid #eb6c34;
      color: #eb6c34;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
    }
    .reset-btn:hover { background: #eb6c34; color: white; }

    .results-banner {
      background: #fcf6e8;
      color: #8c734b;
      padding: 10px 14px;
      border-left: 3px solid #f29e38;
      border-radius: 2px;
      margin-bottom: 20px;
      font-size: 13px;
    }

    /* Pub cards */
    .pub-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      padding: 20px;
      margin-bottom: 16px;
    }
    .pub-title { font-size: 15px; color: #1b4986; margin: 0 0 10px 0; font-weight: 600; line-height: 1.4; }
    .pub-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #666;
      flex-wrap: wrap;
    }
    .pub-type { padding: 3px 9px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .type-article { background: #e6f0fa; color: #1b4986; }
    .type-conference { background: #f0f4f8; color: #2c5282; }
    .type-review { background: #fce8e8; color: #c53030; }
    .type-book { background: #eef8ec; color: #2f855a; }
    .pub-journal { font-style: italic; }
    .pub-cited { color: #888; font-size: 12px; }
    .pub-authors { font-size: 13px; color: #444; margin-bottom: 6px; }
    .authors-label { font-weight: 600; color: #333; }
    .more-authors { color: #888; }
    .pub-extra { font-size: 12px; color: #888; display: flex; gap: 8px; margin-bottom: 6px; }
    .doi-link { font-size: 12px; color: #eb6c34; text-decoration: none; display: block; margin-top: 4px; }
    .doi-link:hover { text-decoration: underline; }
  `]
})
export class TeamPublicationsComponent implements OnInit {
  @Input() team!: Team;

  loading = false;
  error = '';
  allPubs: Publication[] = [];
  memberStats: { [authorId: string]: MemberStats } = {};

  filterRank: 'all' | '1' | '2' = 'all';
  filterYear = '';
  filterTypes = new Set<string>();
  pubTypes = ALL_TYPES;

  constructor(private scopusService: ScopusService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadPublications();
  }

  private async loadPublications(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    try {
      const result = await this.scopusService.fetchTeamPublications(this.team.members);
      this.allPubs = result.uniquePubs;
      this.memberStats = result.memberStats;
    } catch (e: any) {
      this.error = e.message || 'Erreur lors du chargement des publications.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  get availableYears(): string[] {
    const years = new Set(this.allPubs.map(p => p.year).filter(Boolean));
    return [...years].sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }

  get hasActiveFilters(): boolean {
    return this.filterRank !== 'all' || !!this.filterYear || this.filterTypes.size > 0;
  }

  get filteredPubs(): Publication[] {
    let result = [...this.allPubs];
    if (this.filterRank !== 'all') {
      const rank = parseInt(this.filterRank, 10);
      result = result.filter(p => p.authorRank === rank);
    }
    if (this.filterYear) result = result.filter(p => p.year === this.filterYear);
    if (this.filterTypes.size > 0) result = result.filter(p => this.filterTypes.has(p.type));
    return result;
  }

  get topContributors(): { name: string; total: number; firstAuthor: number }[] {
    return Object.values(this.memberStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  get yearRange(): string {
    const years = this.allPubs.map(p => parseInt(p.year, 10)).filter(y => !isNaN(y));
    if (years.length === 0) return '';
    const min = Math.min(...years);
    const max = Math.max(...years);
    return min === max ? String(min) : `${min} → ${max}`;
  }

  typeCount(type: string): number {
    return this.allPubs.filter(p => p.type === type).length;
  }

  toggleType(type: string): void {
    if (this.filterTypes.has(type)) this.filterTypes.delete(type);
    else this.filterTypes.add(type);
    this.filterTypes = new Set(this.filterTypes);
  }

  resetFilters(): void {
    this.filterRank = 'all';
    this.filterYear = '';
    this.filterTypes = new Set<string>();
  }

  getBadgeClass(type: string): string {
    switch (type) {
      case 'Article': return 'type-article';
      case 'Conference': return 'type-conference';
      case 'Review': return 'type-review';
      case 'Book Chapter': return 'type-book';
      default: return 'type-article';
    }
  }
}
