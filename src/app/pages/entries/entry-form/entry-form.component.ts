import { Component, OnInit, AfterContentChecked } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { Entry } from "../shared/entry.model";
import { EntryService } from "../shared/entry.service";

import { Category } from "../../categories/shared/category.model";
import { CategoryService } from "../../categories/shared/category.service";

import { switchMap } from "rxjs/operators";
//rotas

import toastr from "toastr";
//exibe alertas para ações no formulário

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.css']
})
export class EntryFormComponent implements OnInit, AfterContentChecked {

  currentAction: string;
  //vai dizer se está criando ou editando recurso (new ou edit)
  entryForm: FormGroup;
  pageTitle: string;
  //altera dinamicamente o titulo da pagina
  serverErrorMessages: string[] = null;
  submittingForm: boolean = false;
  //para desabilitar o botão depois de um envio
  entry: Entry = new Entry();
  categories: Array<Category>;

  imaskConfig = {
    mask: Number,
    scale: 2,
    thousandsSeparator: '.',
    padFractionalZeros: true,
    radix: ','
  }

  ptBR = {
    firstDayOfWeek: 0,
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
    dayNamesMin: ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sa'],
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
      'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    today: 'Hoje',
    clear: 'Limpar'
  }

  constructor(
    private entryService: EntryService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private categoryService: CategoryService
    //injeção de dependencia
  ) { }

  ngOnInit() {
    //metodos que serão executados
    this.setCurrentAction();
    //executa em sequencia: primeiro - qual ação está sendo executada
    this.buildEntryForm();
    //segundo - constroi o formulario
    this.loadEntry();
    //terceiro - carrega a entrada
    this.loadCategories();
  }

  ngAfterContentChecked() {
  //para executar após a pagina estar toda carregada
    this.setPageTitle();
  }

  submitForm() {
    this.submittingForm = true;
    if(this.currentAction == "new")
      this.createEntry();
    else //currentAction = edit
      this.updateEntry();
  }

  get typeOptions(): Array<any> {
    return Object.entries(Entry.types).map(
      ([value, text]) => {
        return {
          text: text,
          value: value
        }
      }
    )
  }

  //Métodos PRIVADOS
  private setCurrentAction() {
    if(this.route.snapshot.url[0].path == "new")
    //[0] refere-se ao primeiro segmento da url. ex: /entries/new
      this.currentAction = "new"
    else
      this.currentAction = "edit"
    //define a ação, se é criar nova entrada ou editar
  }

  private buildEntryForm() {
    this.entryForm = this.formBuilder.group({
    //cria o formulario
      id: [null],
      name: [null, [Validators.required, Validators.minLength(2)]],
      description: [null],
      type: ["expense", [Validators.required]],
      //coloca expense como valor padrão.
      amount: [null, [Validators.required]],
      date: [null, [Validators.required]],
      paid: [true, [Validators.required]],
      //paid com padrão true
      categoryId: [null, [Validators.required]]
      //campos do formulario
    });
  }

  private loadEntry() {
    if (this.currentAction == "edit") {
      this.route.paramMap.pipe(
        switchMap(params => this.entryService.getById(+params.get("id")))
      )
      .subscribe(
        (entry) => {
          this.entry = entry;
          this.entryForm.patchValue(entry) //binds loaded entry data to EntryForm
        },
        (error) => alert('Ocorreu um erro no servidor, tente mais tarde.')
      )
    }
  }

  private loadCategories(){
    this.categoryService.getAll().subscribe(
      categories => this.categories= categories
    );
  }

  private setPageTitle() {
    if (this.currentAction == "new")
      this.pageTitle = "Cadastro de Novo Lançamento"
    else {
      const entryName = this.entry.name || ""
      this.pageTitle = "Editando Lançamento: " + entryName;
    }
  }

  private createEntry(){
    const entry: Entry = Object.assign(new Entry(), this.entryForm.value);

    this.entryService.create(entry)
      .subscribe(
        entry => this.actionsForSuccess(entry),
        error => this.actionsForError(error)
      )
  }

  private updateEntry() {
    const entry: Entry = Object.assign(new Entry(), this.entryForm.value);

    this.entryService.update(entry)
      .subscribe(
        entry => this.actionsForSuccess(entry),
        error => this.actionsForError(error)
      )
  }

  private actionsForSuccess(entry: Entry){
    toastr.success("Solicitação processada com sucesso!");
    
    //redirect/reload component page
    this.router.navigateByUrl("entries", {skipLocationChange: true}).then(
      () => this.router.navigate(["entries", entry.id, "edit"])
    )
  }

  private actionsForError(error) {
    toastr.error("Ocorreu um erro ao processar sua solicitação!");
    this.submittingForm = false;

     if(error.status === 422)
      this.serverErrorMessages = JSON.parse(error._body).errors;
    else
      this.serverErrorMessages = ["Falha na comunicação com o servidor. Por favor, tente mais tarde."]
  }
}
