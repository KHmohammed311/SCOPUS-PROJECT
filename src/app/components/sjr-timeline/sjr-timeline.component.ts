import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface QuartileEntry {
  year: number;
  quartile: string;
}

@Component({
  selector: 'app-sjr-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sjr-container">
      <button class="sjr-toggle" (click)="toggle()">
        Voir classement journal {{ expanded ? '▲' : '▾' }}
      </button>

      <div class="sjr-panel" *ngIf="expanded">
        <div class="sjr-loading" *ngIf="loading">Chargement des données SJR...</div>
        <div class="sjr-error" *ngIf="!loading && error">{{ error }}</div>

        <div *ngIf="!loading && !error && quartileData.length > 0">
          <div class="journal-info">
            <strong>{{ journalName }}</strong>
            <span class="issn-badge" *ngIf="displayIssn">ISSN : {{ displayIssn }}</span>
          </div>
          <div class="sjr-caption">Classement SJR autour de {{ year }} :</div>
          <div class="sjr-rows">
            <div *ngFor="let row of quartileData"
                 class="sjr-row"
                 [class.current-year]="row.year === pubYear">
              <span class="sjr-arrow">{{ row.year === pubYear ? '→' : '\u00a0\u00a0' }}</span>
              <span class="sjr-year">{{ row.year }}</span>
              <span class="sjr-bar" [style.background-color]="getColor(row.quartile)">{{ row.quartile }}</span>
              <span class="sjr-pub-marker" *ngIf="row.year === pubYear">← année de publication</span>
            </div>
          </div>
        </div>

        <div class="sjr-empty" *ngIf="!loading && !error && quartileData.length === 0">
          Données SJR non disponibles pour ce journal.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sjr-container {
      margin-top: 10px;
    }
    .sjr-toggle {
      background: none;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 12px;
      color: #555;
      cursor: pointer;
      transition: all 0.15s;
    }
    .sjr-toggle:hover {
      border-color: #1b4986;
      color: #1b4986;
    }
    .sjr-panel {
      margin-top: 10px;
      background: #f9fafb;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 16px;
      font-size: 13px;
    }
    .sjr-loading, .sjr-error, .sjr-empty {
      color: #666;
      font-style: italic;
    }
    .sjr-error { color: #c53030; }
    .journal-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      color: #333;
      font-size: 13px;
      flex-wrap: wrap;
    }
    .issn-badge {
      background: #edf2f7;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      color: #555;
    }
    .sjr-caption {
      color: #666;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .sjr-rows {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sjr-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .sjr-row.current-year {
      font-weight: 600;
    }
    .sjr-arrow {
      width: 16px;
      color: #1b4986;
      font-weight: bold;
    }
    .sjr-year {
      width: 40px;
      color: #444;
    }
    .sjr-bar {
      padding: 2px 10px;
      border-radius: 3px;
      color: white;
      font-weight: 600;
      font-size: 12px;
      min-width: 30px;
      text-align: center;
    }
    .sjr-pub-marker {
      font-size: 11px;
      color: #1b4986;
      font-style: italic;
    }
  `]
})
export class SjrTimelineComponent {
  @Input() issn = '';
  @Input() eissn = '';
  @Input() year = '';
  @Input() journalName = '';

  expanded = false;
  loading = false;
  error = '';
  quartileData: QuartileEntry[] = [];
  fetched = false;

  get pubYear(): number { return parseInt(this.year, 10); }
  get displayIssn(): string { return this.issn || this.eissn || ''; }

  constructor(private http: HttpClient) {}

  toggle(): void {
    this.expanded = !this.expanded;
    if (this.expanded && !this.fetched) this.fetchData();
  }

  private async fetchData(): Promise<void> {
    const issn = this.issn || this.eissn;
    if (!issn) {
      this.error = 'ISSN non disponible pour ce journal.';
      this.fetched = true;
      return;
    }

    this.loading = true;
    this.fetched = true;
    try {
      const data = await firstValueFrom(
        this.http.get<any[]>(`/api/sjr?issn=${encodeURIComponent(issn)}`)
      );
      this.quartileData = this.parseQuartiles(data ?? []);
    } catch {
      // silently show "non disponible" — SCImago may be unavailable
      this.quartileData = [];
    } finally {
      this.loading = false;
    }
  }

  private parseQuartiles(data: any[]): QuartileEntry[] {
    if (!data || data.length === 0) return [];
    const journal = data[0];
    const pubYear = this.pubYear;
    if (isNaN(pubYear)) return [];

    const yearRange = [pubYear - 2, pubYear - 1, pubYear, pubYear + 1, pubYear + 2];
    const qMap = new Map<number, string>();

    const toQ = (v: any): string => {
      const s = String(v || '').trim();
      return s.startsWith('Q') ? s : s ? `Q${s}` : '';
    };

    // Format: separate quartile array [{year, value}]
    if (Array.isArray(journal.quartile)) {
      for (const q of journal.quartile) {
        const y = parseInt(String(q.year ?? q.Year ?? ''), 10);
        const v = toQ(q.value ?? q.Value ?? q.quartile ?? '');
        if (!isNaN(y) && v) qMap.set(y, v);
      }
    }

    // Format: sjr array with quartile property [{year, value, quartile}]
    if (qMap.size === 0 && Array.isArray(journal.sjr)) {
      for (const s of journal.sjr) {
        if (s.quartile !== undefined) {
          const y = parseInt(String(s.year ?? s.Year ?? ''), 10);
          const v = toQ(s.quartile);
          if (!isNaN(y) && v) qMap.set(y, v);
        }
      }
    }

    // Format: parallel arrays sjr_year[], sjr_quartile[]
    if (qMap.size === 0 && Array.isArray(journal.sjr_year) && Array.isArray(journal.sjr_quartile)) {
      for (let i = 0; i < journal.sjr_year.length; i++) {
        const y = parseInt(String(journal.sjr_year[i] ?? ''), 10);
        const v = toQ(journal.sjr_quartile[i] ?? '');
        if (!isNaN(y) && v) qMap.set(y, v);
      }
    }

    return yearRange
      .filter(y => qMap.has(y))
      .map(y => ({ year: y, quartile: qMap.get(y)! }));
  }

  getColor(q: string): string {
    switch (q) {
      case 'Q1': return '#276749';
      case 'Q2': return '#48bb78';
      case 'Q3': return '#ed8936';
      case 'Q4': return '#e53e3e';
      default: return '#a0aec0';
    }
  }
}
