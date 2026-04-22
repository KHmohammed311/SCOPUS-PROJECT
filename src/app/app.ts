import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { SearchComponent } from './components/search/search.component';
import { AuthorListComponent } from './components/author-list/author-list.component';
import { PublicationListComponent } from './components/publication-list/publication-list.component';
import { TeamModalComponent } from './components/team-modal/team-modal.component';
import { TeamListComponent } from './components/team-list/team-list.component';
import { TeamPublicationsComponent } from './components/team-publications/team-publications.component';
import { ScopusService, Author, Publication } from './services/scopus.service';
import { TeamService, Team } from './services/team.service';

type AppView = 'search' | 'teams' | 'team-pubs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SearchComponent,
    AuthorListComponent,
    PublicationListComponent,
    TeamModalComponent,
    TeamListComponent,
    TeamPublicationsComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // View state
  view: AppView = 'search';

  // Search view
  authors: Author[] = [];
  selectedAuthor: Author | null = null;
  publications: Publication[] = [];
  loadingAuthors = false;
  loadingPublications = false;
  error = '';

  // Teams
  teams: Team[] = [];
  selectedTeam: Team | null = null;
  showTeamModal = false;
  editingTeam: Team | null = null;

  constructor(
    private scopusService: ScopusService,
    private teamService: TeamService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.teams = this.teamService.getTeams();
  }

  // ── Search ────────────────────────────────────────────────

  async onSearch(params: { firstName: string; lastName: string }): Promise<void> {
    this.view = 'search';
    this.authors = [];
    this.selectedAuthor = null;
    this.publications = [];
    this.error = '';

    if (!params.firstName && !params.lastName) {
      this.error = 'Veuillez saisir un prénom ou un nom.';
      return;
    }

    this.loadingAuthors = true;
    this.cdr.detectChanges();
    try {
      const result = await this.scopusService.searchAuthors(params.firstName, params.lastName);
      this.authors = result.authors;
      if (this.authors.length === 0) this.error = 'Aucun auteur trouvé.';
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de la recherche.';
    } finally {
      this.loadingAuthors = false;
      this.cdr.detectChanges();
    }
  }

  async onAuthorSelect(author: Author): Promise<void> {
    this.selectedAuthor = author;
    this.publications = [];
    this.loadingPublications = true;
    this.error = '';
    this.cdr.detectChanges();
    try {
      const result = await this.scopusService.fetchPublications(author.authorId);
      this.publications = result.pubs;
    } catch (err: any) {
      this.error = err.message || 'Erreur lors du chargement des publications.';
    } finally {
      this.loadingPublications = false;
      this.cdr.detectChanges();
    }
  }

  // ── Navigation ────────────────────────────────────────────

  goToTeams(): void {
    this.teams = this.teamService.getTeams();
    this.view = 'teams';
    this.cdr.detectChanges();
  }

  goToSearch(): void {
    this.view = 'search';
    this.cdr.detectChanges();
  }

  // ── Team management ───────────────────────────────────────

  openTeamModal(team: Team | null = null): void {
    this.editingTeam = team;
    this.showTeamModal = true;
  }

  closeTeamModal(): void {
    this.showTeamModal = false;
    this.editingTeam = null;
  }

  onTeamSave(team: Team): void {
    this.teamService.saveTeam(team);
    this.teams = this.teamService.getTeams();
    this.closeTeamModal();
    this.cdr.detectChanges();
  }

  onDeleteTeam(teamId: string): void {
    this.teamService.deleteTeam(teamId);
    this.teams = this.teamService.getTeams();
    this.cdr.detectChanges();
  }

  onViewTeam(team: Team): void {
    this.selectedTeam = team;
    this.view = 'team-pubs';
    this.cdr.detectChanges();
  }
}
