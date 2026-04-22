import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Author, Publication } from '../../services/scopus.service';
import { AuthorSummaryComponent } from '../author-summary/author-summary.component';
import { SjrTimelineComponent } from '../sjr-timeline/sjr-timeline.component';

const ALL_TYPES = ['Article', 'Conference', 'Book Chapter', 'Review'];

@Component({
  selector: 'app-publication-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AuthorSummaryComponent, SjrTimelineComponent],
  template: `
    <div class="pub-list-container">
      <div class="list-header" *ngIf="author">
        <h2 class="list-title">Publications de {{ author.fullName }}</h2>
      </div>

      <div class="pub-scroll">
        <div *ngIf="!author && publications.length === 0" class="empty-state">
          Sélectionnez un auteur dans la liste pour voir ses publications (1<sup>er</sup>/2<sup>ème</sup> auteur).
        </div>

        <div *ngIf="author && loading" class="empty-state">
          Récupération des publications...
        </div>

        <div *ngIf="(author || publications.length > 0) && !loading" class="content-wrapper">

          <!-- Feature 1: Author Summary Card -->
          <app-author-summary
            *ngIf="author && publications.length > 0"
            [publications]="publications"
            [authorName]="author.fullName">
          </app-author-summary>

          <!-- Feature 2: Filters -->
          <div class="filters-panel" *ngIf="publications.length > 0">
            <div class="filters-row">

              <!-- Rank filter -->
              <div class="filter-group">
                <label class="filter-label">Rang auteur</label>
                <div class="btn-group">
                  <button class="toggle-btn" [class.active]="filterRank === 'all'" (click)="filterRank = 'all'">Tous</button>
                  <button class="toggle-btn" [class.active]="filterRank === '1'" (click)="filterRank = '1'">1<sup>er</sup></button>
                  <button class="toggle-btn" [class.active]="filterRank === '2'" (click)="filterRank = '2'">2<sup>ème</sup></button>
                </div>
              </div>

              <!-- Year filter -->
              <div class="filter-group">
                <label class="filter-label">Année</label>
                <select class="year-select" [(ngModel)]="filterYear">
                  <option value="">Toutes</option>
                  <option *ngFor="let y of availableYears" [value]="y">{{ y }}</option>
                </select>
              </div>

              <!-- Type filter -->
              <div class="filter-group">
                <label class="filter-label">Type de publication</label>
                <div class="type-checks">
                  <label *ngFor="let t of pubTypes" class="check-label">
                    <input type="checkbox"
                           [checked]="filterTypes.has(t)"
                           (change)="toggleType(t)">
                    {{ t }}
                  </label>
                </div>
              </div>

              <button class="reset-btn" (click)="resetFilters()" *ngIf="hasActiveFilters">
                Réinitialiser
              </button>
            </div>
          </div>

          <div class="filter-banner" *ngIf="author">
            {{ filteredPubs.length }} publication{{ filteredPubs.length !== 1 ? 's' : '' }}
            <span *ngIf="!hasActiveFilters"> où {{ author.surname }} est 1<sup>er</sup> ou 2<sup>ème</sup> auteur</span>
            <span *ngIf="hasActiveFilters"> affichée{{ filteredPubs.length !== 1 ? 's' : '' }} (filtre actif)</span>
          </div>

          <div *ngIf="filteredPubs.length === 0 && publications.length > 0" class="empty-state">
            Aucune publication ne correspond aux filtres sélectionnés.
          </div>

          <div *ngIf="publications.length === 0" class="empty-state">
            Aucune publication trouvée où cet auteur est 1<sup>er</sup> ou 2<sup>ème</sup> auteur.
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
              <span class="authors-label">Auteurs : </span>
              <span [innerHTML]="highlightAuthor(pub.authors, author?.surname, pub.authorRank)"></span>
              <span *ngIf="pub.moreAuthors" class="more-authors">{{ pub.moreAuthors }}</span>
            </div>

            <div class="pub-extra" *ngIf="pub.volume || pub.issue || pub.pages">
              <span *ngIf="pub.volume">Vol. {{ pub.volume }}</span>
              <span *ngIf="pub.issue">No. {{ pub.issue }}</span>
              <span *ngIf="pub.pages">p. {{ pub.pages }}</span>
            </div>

            <a *ngIf="pub.doi" [href]="'https://doi.org/' + pub.doi" target="_blank" class="doi-link">
              DOI: {{ pub.doi }}
            </a>

            <!-- Feature 4: SJR Timeline (only for journal articles/reviews) -->
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
    </div>
  `,
  styles: [`
    .pub-list-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .list-header {
      padding: 20px 24px;
      border-bottom: 1px solid #eee;
    }
    .list-title {
      font-size: 18px;
      color: #1b4986;
      margin: 0;
      font-weight: 600;
    }
    .pub-scroll {
      flex: 1;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    }
    .content-wrapper { padding: 24px; }
    .empty-state {
      padding: 40px;
      color: #666;
      text-align: center;
    }

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
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .filter-label {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-group {
      display: flex;
      gap: 0;
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
    .toggle-btn.active {
      background: #1b4986;
      color: white;
    }
    .year-select {
      padding: 6px 10px;
      border: 1px solid #d0dff5;
      border-radius: 4px;
      font-size: 13px;
      color: #333;
      background: white;
      outline: none;
      cursor: pointer;
    }
    .type-checks {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .check-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: #444;
      cursor: pointer;
    }
    .check-label input { cursor: pointer; }
    .reset-btn {
      align-self: flex-end;
      background: none;
      border: 1px solid #eb6c34;
      color: #eb6c34;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .reset-btn:hover { background: #eb6c34; color: white; }

    .filter-banner {
      background-color: #fcf6e8;
      color: #8c734b;
      padding: 10px 14px;
      border-left: 3px solid #f29e38;
      border-radius: 2px;
      margin-bottom: 20px;
      font-size: 13px;
    }

    /* Pub cards */
    .pub-card {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #eee;
    }
    .pub-card:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .pub-title {
      font-size: 15px;
      color: #1b4986;
      margin: 0 0 8px 0;
      font-weight: 600;
      line-height: 1.4;
    }
    .pub-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #666;
      flex-wrap: wrap;
    }
    .pub-type {
      padding: 3px 9px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }
    .type-article { background: #e6f0fa; color: #1b4986; }
    .type-conference { background: #f0f4f8; color: #2c5282; }
    .type-review { background: #fce8e8; color: #c53030; }
    .type-book { background: #eef8ec; color: #2f855a; }
    .pub-journal { font-style: italic; }
    .pub-cited { color: #888; font-size: 12px; }

    .pub-authors {
      font-size: 13px;
      color: #444;
      margin-bottom: 6px;
      line-height: 1.5;
    }
    .authors-label { font-weight: 600; color: #333; }
    .more-authors { color: #888; }

    .pub-extra {
      font-size: 12px;
      color: #888;
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    .doi-link {
      font-size: 12px;
      color: #eb6c34;
      text-decoration: none;
      display: block;
      margin-top: 4px;
    }
    .doi-link:hover { text-decoration: underline; }

    ::ng-deep .highlighted-author {
      color: #eb6c34;
      font-weight: 600;
    }
  `]
})
export class PublicationListComponent implements OnChanges {
  @Input() author: Author | null = null;
  @Input() publications: Publication[] = [];
  @Input() loading = false;

  filterRank: 'all' | '1' | '2' = 'all';
  filterYear = '';
  filterTypes = new Set<string>();
  pubTypes = ALL_TYPES;

  ngOnChanges(): void {
    this.resetFilters();
  }

  get availableYears(): string[] {
    const years = new Set(this.publications.map(p => p.year).filter(Boolean));
    return [...years].sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }

  get hasActiveFilters(): boolean {
    return this.filterRank !== 'all' || !!this.filterYear || this.filterTypes.size > 0;
  }

  get filteredPubs(): Publication[] {
    let result = this.publications
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (this.filterRank !== 'all') {
      const rank = parseInt(this.filterRank, 10);
      result = result.filter(p => p.authorRank === rank);
    }
    if (this.filterYear) {
      result = result.filter(p => p.year === this.filterYear);
    }
    if (this.filterTypes.size > 0) {
      result = result.filter(p => this.filterTypes.has(p.type));
    }
    return result;
  }

  toggleType(type: string): void {
    if (this.filterTypes.has(type)) this.filterTypes.delete(type);
    else this.filterTypes.add(type);
    // trigger change detection on Set reference
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

  highlightAuthor(authorsList: string, targetSurname: string | undefined, rank: number | null): string {
    if (!targetSurname || !authorsList) return authorsList || '';
    const regex = new RegExp(`(${targetSurname}[^,]*)`, 'gi');
    return authorsList.replace(regex, `<span class="highlighted-author">$1 (pos. ${rank ?? '?'})</span>`);
  }
}
