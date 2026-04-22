import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Publication } from '../../services/scopus.service';

interface SummaryRow {
  label: string;
  icon: string;
  first: number;
  second: number;
  total: number;
}

const PUB_TYPES = [
  { key: 'Conference', label: 'Conference Paper', icon: '🎤' },
  { key: 'Book Chapter', label: 'Book Chapter', icon: '📚' },
  { key: 'Article', label: 'Article', icon: '📄' },
  { key: 'Review', label: 'Review', icon: '🔍' },
];

@Component({
  selector: 'app-author-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-card">
      <div class="summary-author">{{ authorName }}</div>
      <div class="summary-divider"></div>
      <div class="summary-table-wrap">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>1<sup>er</sup> auteur</th>
              <th>2<sup>ème</sup> auteur</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows">
              <td class="type-cell">
                <span class="type-icon">{{ row.icon }}</span>{{ row.label }}
              </td>
              <td class="num-cell">{{ row.first }}</td>
              <td class="num-cell">{{ row.second }}</td>
              <td class="num-cell total-col">{{ row.total }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>TOTAL</strong></td>
              <td class="num-cell"><strong>{{ totals.first }}</strong></td>
              <td class="num-cell"><strong>{{ totals.second }}</strong></td>
              <td class="num-cell total-col"><strong>{{ totals.total }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      background: linear-gradient(135deg, #f0f5ff 0%, #fff8f0 100%);
      border: 1px solid #d0dff5;
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }
    .summary-author {
      font-size: 18px;
      font-weight: 700;
      color: #1b4986;
      margin-bottom: 12px;
    }
    .summary-divider {
      height: 1px;
      background: linear-gradient(90deg, #1b4986 0%, transparent 100%);
      margin-bottom: 16px;
      opacity: 0.3;
    }
    .summary-table-wrap {
      overflow-x: auto;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .summary-table thead th {
      text-align: center;
      padding: 8px 12px;
      color: #555;
      font-weight: 600;
      border-bottom: 2px solid #dde8f5;
      white-space: nowrap;
    }
    .summary-table thead th:first-child {
      text-align: left;
    }
    .summary-table tbody tr:hover {
      background: rgba(27, 73, 134, 0.04);
    }
    .type-cell {
      padding: 9px 12px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .type-icon {
      font-size: 16px;
    }
    .num-cell {
      text-align: center;
      padding: 9px 12px;
      color: #555;
    }
    .total-col {
      color: #1b4986;
      font-weight: 600;
    }
    .total-row td {
      border-top: 2px solid #dde8f5;
      padding: 10px 12px;
      background: rgba(27, 73, 134, 0.04);
    }
    .total-row .num-cell {
      color: #1b4986;
    }
  `]
})
export class AuthorSummaryComponent implements OnChanges {
  @Input() publications: Publication[] = [];
  @Input() authorName = '';

  rows: SummaryRow[] = [];
  totals = { first: 0, second: 0, total: 0 };

  ngOnChanges(): void {
    this.compute();
  }

  private compute(): void {
    this.rows = PUB_TYPES.map(t => {
      const pubs = this.publications.filter(p => p.type === t.key);
      const first = pubs.filter(p => p.authorRank === 1).length;
      const second = pubs.filter(p => p.authorRank === 2).length;
      return { label: t.label, icon: t.icon, first, second, total: first + second };
    });
    this.totals = {
      first: this.rows.reduce((s, r) => s + r.first, 0),
      second: this.rows.reduce((s, r) => s + r.second, 0),
      total: this.rows.reduce((s, r) => s + r.total, 0),
    };
  }
}
