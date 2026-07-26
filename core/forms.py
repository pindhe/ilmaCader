from django import forms
from .models import Category


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ("name", "kind", "description", "is_active")
        labels = {
            "name": "Family head name",
            "kind": "Type",
            "description": "Notes",
            "is_active": "Active",
        }
        widgets = {
            "name": forms.TextInput(
                attrs={
                    "class": "form-input",
                    "placeholder": "e.g. Ahmed Hassan (family head)",
                }
            ),
            "kind": forms.Select(attrs={"class": "form-input"}),
            "description": forms.Textarea(
                attrs={
                    "class": "form-input",
                    "rows": 3,
                    "placeholder": "Optional notes about this family group",
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            self.fields["kind"].initial = Category.Kind.FAMILY
        self.fields["name"].help_text = (
            "Create one entry per family head (e.g. each brother’s name)."
        )
