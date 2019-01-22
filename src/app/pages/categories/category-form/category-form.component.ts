import { Component, OnInit, AfterContentChecked } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { Category } from "../shared/category.model";
import { CategoryService } from "../shared/category.service";

import { switchMap } from "rxjs/operators";
//rotas

import toastr from "toastr";
//exibe alertas para ações no formulário

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit, AfterContentChecked {

  currentAction: string;
  //vai dizer se está criando ou editando recurso (new ou edit)
  categoryForm: FormGroup;
  pageTitle: string;
  //altera dinamicamente o titulo da pagina
  serverErrorMessages: string[] = null;
  submittingForm: boolean = false;
  //para desabilitar o botão depois de um envio
  category: Category = new Category();

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder
    //injeção de dependencia
  ) { }

  ngOnInit() {
    //metodos que serão executados
    this.setCurrentAction();
    //executa em sequencia: primeiro - qual ação está sendo executada
    this.buildCategoryForm();
    //segundo - constroi o formulario
    this.loadCategory();
    //terceiro - carrega a categoria
  }

  ngAfterContentChecked() {
  //para executar após a pagina estar toda carregada
    this.setPageTitle();
  }

  submitForm() {
    this.submittingForm = true;
    if(this.currentAction == "new")
      this.createCategory();
    else //currentAction = edit
      this.updateCategory();
  }

  //Métodos PRIVADOS
  private setCurrentAction() {
    if(this.route.snapshot.url[0].path == "new")
    //[0] refere-se ao primeiro segmento da url. ex: /categories/new
      this.currentAction = "new"
    else
      this.currentAction = "edit"
    //define a ação, se é criar nova categoria ou editar
  }

  private buildCategoryForm() {
    this.categoryForm = this.formBuilder.group({
    //cria o formulario
      id: [null],
      name: [null, [Validators.required, Validators.minLength(4)]],
      description: [null]
      //campos do formulario
    })
  }

  private loadCategory() {
    if (this.currentAction == "edit") {
      this.route.paramMap.pipe(
        switchMap(params => this.categoryService.getById(+params.get("id")))
      )
      .subscribe(
        (category) => {
          this.category = category;
          this.categoryForm.patchValue(category) //binds loaded category data to CategoryForm
        },
        (error) => alert('Ocorreu um erro no servidor, tente mais tarde.')
      )
    }
  }

  private setPageTitle() {
    if (this.currentAction == "new")
      this.pageTitle = "Cadastro de Nova Categoria"
    else {
      const categoryName = this.category.name || ""
      this.pageTitle = "Editando Categoria: " + categoryName;
    }
  }

  private createCategory(){
    const category: Category = Object.assign(new Category(), this.categoryForm.value);

    this.categoryService.create(category)
      .subscribe(
        category => this.actionsForSuccess(category),
        error => this.actionsForError(error)
      )
  }

  private updateCategory() {
    const category: Category = Object.assign(new Category(), this.categoryForm.value);

    this.categoryService.update(category)
      .subscribe(
        category => this.actionsForSuccess(category),
        error => this.actionsForError(error)
      )
  }

  private actionsForSuccess(category: Category){
    toastr.success("Solicitação processada com sucesso!");
    
    //redirect/reload component page
    this.router.navigateByUrl("categories", {skipLocationChange: true}).then(
      () => this.router.navigate(["categories", category.id, "edit"])
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
