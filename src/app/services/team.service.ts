import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface TeamMember {
  authorId: string;
  fullName: string;
  surname: string;
  givenName: string;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly KEY = 'scopus_teams_v1';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getTeams(): Team[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch {
      return [];
    }
  }

  saveTeam(team: Team): void {
    if (!this.isBrowser) return;
    const teams = this.getTeams();
    const idx = teams.findIndex(t => t.id === team.id);
    if (idx >= 0) teams[idx] = team;
    else teams.push(team);
    localStorage.setItem(this.KEY, JSON.stringify(teams));
  }

  deleteTeam(id: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.KEY, JSON.stringify(this.getTeams().filter(t => t.id !== id)));
  }

  newId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
