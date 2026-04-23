import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface YearRank {
  year: number;
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  citeScore: string;
  percentile: number;
  isCurrent: boolean;
}

@Component({
  selector: 'app-sjr-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="jr-wrap">
      <button class="jr-toggle" (click)="toggle()">
        <span class="jr-toggle-icon">📊</span>
        Classement du journal
        <span class="jr-chevron">{{ expanded ? '▲' : '▾' }}</span>
      </button>

      <div class="jr-panel" *ngIf="expanded">

        <!-- Loading -->
        <div class="jr-loading" *ngIf="loading">
          <span class="jr-spinner"></span> Chargement du classement...
        </div>

        <!-- No data -->
        <div class="jr-empty" *ngIf="!loading && rows.length === 0">
          Classement non disponible pour ce journal.
        </div>

        <!-- Data -->
        <div *ngIf="!loading && rows.length > 0">
          <div class="jr-header">
            <span class="jr-title">{{ journalName }}</span>
            <span class="jr-issn" *ngIf="displayIssn">ISSN {{ displayIssn }}</span>
          </div>

          <div class="jr-subtitle">
            Quartile CiteScore autour de {{ year }} :
          </div>

          <div class="jr-rows">
            <div *ngFor="let row of rows"
                 class="jr-row"
                 [class.jr-row--current]="row.isCurrent">

              <!-- Arrow marker -->
              <span class="jr-arrow">{{ row.isCurrent ? '→' : '' }}</span>

              <!-- Year -->
              <span class="jr-year" [class.jr-year--current]="row.isCurrent">
                {{ row.year }}
              </span>

              <!-- Quartile badge -->
              <span class="jr-badge"
                    [style.background-color]="bgColor(row.quartile)"
                    [style.color]="'white'">
                {{ row.quartile }}
              </span>

              <!-- CiteScore -->
              <span class="jr-score">CiteScore {{ row.citeScore }}</span>

              <!-- Percentile -->
              <span class="jr-pct">{{ row.percentile }}<sup>e</sup> centile</span>

              <!-- "pub year" label -->
              <span class="jr-pub-label" *ngIf="row.isCurrent">← publication</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="jr-legend">
            <span class="jr-leg-item"><span class="jr-leg-dot" style="background:#276749"></span>Q1 ≥ 75e centile</span>
            <span class="jr-leg-item"><span class="jr-leg-dot" style="background:#48bb78"></span>Q2 ≥ 50e</span>
            <span class="jr-leg-item"><span class="jr-leg-dot" style="background:#ed8936"></span>Q3 ≥ 25e</span>
            <span class="jr-leg-item"><span class="jr-leg-dot" style="background:#e53e3e"></span>Q4 &lt; 25e</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .jr-wrap {
      margin-top: 10px;
    }

    /* Toggle button */
    .jr-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f0f5ff;
      border: 1px solid #c3d3f0;
      border-radius: 5px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #1b4986;
      cursor: pointer;
      transition: all 0.15s;
    }
    .jr-toggle:hover {
      background: #dde8fa;
      border-color: #1b4986;
    }
    .jr-toggle-icon { font-size: 13px; }
    .jr-chevron { font-size: 10px; margin-left: 2px; }

    /* Panel */
    .jr-panel {
      margin-top: 8px;
      background: #fafbff;
      border: 1px solid #dde8f5;
      border-radius: 8px;
      padding: 14px 16px;
    }

    /* Loading */
    .jr-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666;
    }
    .jr-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #d0dff5;
      border-top-color: #1b4986;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .jr-empty {
      font-size: 13px;
      color: #999;
      font-style: italic;
    }

    /* Header */
    .jr-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }
    .jr-title {
      font-size: 13px;
      font-weight: 600;
      color: #1b4986;
    }
    .jr-issn {
      font-size: 11px;
      background: #e8f0fe;
      color: #1b4986;
      padding: 2px 8px;
      border-radius: 8px;
      font-weight: 500;
    }
    .jr-subtitle {
      font-size: 11px;
      color: #888;
      margin-bottom: 10px;
    }

    /* Rows */
    .jr-rows {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 12px;
    }
    .jr-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 8px;
      border-radius: 5px;
      transition: background 0.1s;
    }
    .jr-row:hover { background: #f0f5ff; }
    .jr-row--current {
      background: #eef4ff;
      border-left: 3px solid #1b4986;
      padding-left: 5px;
    }

    .jr-arrow {
      width: 14px;
      font-size: 12px;
      color: #1b4986;
      font-weight: bold;
      flex-shrink: 0;
    }
    .jr-year {
      width: 38px;
      font-size: 13px;
      color: #555;
      flex-shrink: 0;
    }
    .jr-year--current {
      font-weight: 700;
      color: #1b4986;
    }
    .jr-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 2px 9px;
      border-radius: 4px;
      min-width: 28px;
      text-align: center;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }
    .jr-score {
      font-size: 12px;
      color: #555;
    }
    .jr-pct {
      font-size: 11px;
      color: #999;
      margin-left: auto;
    }
    .jr-pub-label {
      font-size: 11px;
      color: #eb6c34;
      font-weight: 600;
      white-space: nowrap;
    }

    /* Legend */
    .jr-legend {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      padding-top: 10px;
      border-top: 1px solid #e8eef8;
    }
    .jr-leg-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #777;
    }
    .jr-leg-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      flex-shrink: 0;
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
  rows: YearRank[] = [];
  fetched = false;

  get displayIssn(): string { return this.issn || this.eissn || ''; }
  get pubYear(): number { return parseInt(this.year, 10); }

  constructor(private http: HttpClient) {}

  toggle(): void {
    this.expanded = !this.expanded;
    if (this.expanded && !this.fetched) this.fetchData();
  }

  private async fetchData(): Promise<void> {
    const issn = this.issn || this.eissn;
    if (!issn) { this.fetched = true; return; }

    this.loading = true;
    this.fetched = true;
    try {
      const data = await firstValueFrom(
        this.http.get<any>(`/api/journal-rank?issn=${encodeURIComponent(issn)}`)
      );
      this.rows = this.parseRows(data);
    } catch {
      this.rows = [];
    } finally {
      this.loading = false;
    }
  }

  private parseRows(data: any): YearRank[] {
    const entry = data?.['serial-metadata-response']?.entry?.[0];
    if (!entry) return [];

    const pubYear = this.pubYear;
    if (isNaN(pubYear)) return [];

    const yearRange = new Set([pubYear - 2, pubYear - 1, pubYear, pubYear + 1, pubYear + 2]);
    const resultMap = new Map<number, YearRank>();

    // citeScoreYearInfoList contains per-year percentile and CiteScore
    const yearInfoRaw = entry?.citeScoreYearInfoList?.citeScoreYearInfo;
    const yearInfos: any[] = Array.isArray(yearInfoRaw) ? yearInfoRaw : (yearInfoRaw ? [yearInfoRaw] : []);

    for (const yi of yearInfos) {
      const yr = parseInt(yi['@year'] ?? '', 10);
      if (isNaN(yr) || !yearRange.has(yr)) continue;

      let citeScore = '';
      let percentile: number | null = null;

      const infoListRaw = yi?.citeScoreInformationList;
      const infoList: any[] = Array.isArray(infoListRaw) ? infoListRaw : (infoListRaw ? [infoListRaw] : []);

      outer:
      for (const info of infoList) {
        const csInfoRaw = info?.citeScoreInfo;
        const csInfos: any[] = Array.isArray(csInfoRaw) ? csInfoRaw : (csInfoRaw ? [csInfoRaw] : []);

        for (const cs of csInfos) {
          if (!citeScore && cs.citeScore) citeScore = cs.citeScore;

          const srRaw = cs?.citeScoreSubjectRank;
          const srs: any[] = Array.isArray(srRaw) ? srRaw : (srRaw ? [srRaw] : []);

          for (const sr of srs) {
            const pct = parseInt(sr?.percentile ?? '', 10);
            if (!isNaN(pct)) { percentile = pct; break outer; }
          }
        }
      }

      if (percentile !== null) {
        resultMap.set(yr, {
          year: yr,
          quartile: this.toQuartile(percentile),
          citeScore,
          percentile,
          isCurrent: yr === pubYear,
        });
      }
    }

    return [pubYear - 2, pubYear - 1, pubYear, pubYear + 1, pubYear + 2]
      .filter(y => resultMap.has(y))
      .map(y => resultMap.get(y)!);
  }

  private toQuartile(percentile: number): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
    if (percentile >= 75) return 'Q1';
    if (percentile >= 50) return 'Q2';
    if (percentile >= 25) return 'Q3';
    return 'Q4';
  }

  bgColor(q: string): string {
    switch (q) {
      case 'Q1': return '#276749';
      case 'Q2': return '#48bb78';
      case 'Q3': return '#ed8936';
      case 'Q4': return '#e53e3e';
      default:   return '#a0aec0';
    }
  }
}
