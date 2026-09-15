import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from './services/usuario.service';
import { Usuario } from './models/usuario.model';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
    usuarios = signal<Usuario[]>([]);
    cargando = signal<boolean>(false);
    error = signal<string | null>(null);

  // Usuario en edición (null = modo "crear nuevo")
    usuarioActual: Usuario = this.usuarioVacio();
    editando = false;

    constructor(private usuarioService: UsuarioService) {}

    ngOnInit(): void {
        this.cargarUsuarios();
    }

    usuarioVacio(): Usuario {
        return { nombre: '', edad: '', tipo: '' };
    }

    cargarUsuarios(): void {
        this.cargando.set(true);
        this.error.set(null);
        this.usuarioService.obtenerUsuarios().subscribe({
            next: (data) => {
                this.usuarios.set(data);
                this.cargando.set(false);
            },  
            error: (err) => {
                console.error(err);
                this.error.set(
                    'No se pudo conectar con el endpoint. Verifica que esté corriendo en http://localhost:3000',
                );
                this.cargando.set(false);
            },
        });
    }

    guardar(): void {
        if (!this.usuarioActual.nombre.trim()) {
            return;
        }      
        if (this.editando && this.usuarioActual.id) {
            this.usuarioService.actualizarUsuario(this.usuarioActual).subscribe({
                next: () => {
                    this.cargarUsuarios();
                    this.cancelarEdicion();
                },
                error: (err) => this.manejarErrorEscritura(err),
            });
        } else {
            this.usuarioService.crearUsuario(this.usuarioActual).subscribe({
                next: () => {
                    this.cargarUsuarios();
                    this.cancelarEdicion();
                },
                error: (err) => this.manejarErrorEscritura(err),
            });
        }
    }

    editar(usuario: Usuario): void {
        this.usuarioActual = { ...usuario };
        this.editando = true;
    }

    eliminar(usuario: Usuario): void {
        if (!usuario.id) return;
        const confirmado = confirm(`¿Eliminar a "${usuario.nombre}"?`);
        if (!confirmado) return;
        
        this.usuarioService.eliminarUsuario(usuario.id).subscribe({
            next: () => this.cargarUsuarios(),
            error: (err) => this.manejarErrorEscritura(err),
        });
    }

    cancelarEdicion(): void {
        this.usuarioActual = this.usuarioVacio();
        this.editando = false;
    }

    private manejarErrorEscritura(err: unknown): void {
        console.error(err);
        this.error.set(
            'La operación falló. Si estás creando/editando, revisa que el endpoint soporte esa ruta.',
        );
    }
}