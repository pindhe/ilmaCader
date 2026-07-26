from django import forms
from .models import Category


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ("name", "kind", "description", "is_active")
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-input", "placeholder": "Category name"}),
            "kind": forms.Select(attrs={"class": "form-input"}),
            "description": forms.Textarea(attrs={"class": "form-input", "rows": 3, "placeholder": "Optional description"}),
        }
