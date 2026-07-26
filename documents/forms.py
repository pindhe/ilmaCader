from django import forms
from .models import Document


class DocumentUploadForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ("doc_type", "title", "file")
        widgets = {
            "doc_type": forms.Select(attrs={"class": "form-input"}),
            "title": forms.TextInput(attrs={"class": "form-input", "placeholder": "Optional title"}),
            "file": forms.ClearableFileInput(attrs={"class": "form-input"}),
        }
