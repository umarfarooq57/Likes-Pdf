"""
Conversion Endpoints
Document format conversion operations - Synchronous Processing
"""

import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.core.config import settings
from app.services.document_service import DocumentService
from app.services.conversion_service import ConversionService
from app.models.conversion import ConversionType, ConversionStatus
from app.schemas.conversion import (
    ConversionRequest,
    ConversionResponse,
    ConversionStatusResponse,
    HtmlToPdfRequest,
    MarkdownToPdfRequest,
)

# Engines
from app.engines.converter_engine import ConverterEngine
from app.engines.pdf_engine import PDFEngine

router = APIRouter()


@router.post("/pdf-to-images", response_model=ConversionResponse)
async def convert_pdf_to_images(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PDF to images (PNG/JPG)"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    img_format = request.options.get("format", "png") if request.options else "png"
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_IMAGES,
        user_id=user_id,
        target_format=img_format,
        options=request.options
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_dir = Path(settings.TEMP_DIR) / str(conversion.id)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        dpi = request.options.get("dpi", 150) if request.options else 150
        image_files = ConverterEngine.pdf_to_images(
            pdf_path=input_path,
            output_dir=output_dir,
            format=img_format,
            dpi=dpi
        )
        
        if not image_files:
            raise Exception("No images generated")
            
        if len(image_files) == 1:
            # Single image result
            result_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.{img_format}"
            import shutil
            shutil.copy(image_files[0], result_path)
            await conv_service.mark_completed(conversion.id, str(result_path))
        else:
            # Multiple images - ZIP them
            result_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.zip"
            ConverterEngine.zip_files(image_files, result_path)
            await conv_service.mark_completed(conversion.id, str(result_path), f"{document.original_name}_images.zip")
            
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    # Cleanup temp dir
    import shutil
    if output_dir.exists():
        shutil.rmtree(output_dir)
        
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/images-to-pdf", response_model=ConversionResponse)
async def convert_images_to_pdf(
    document_ids: List[str],
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert images to PDF"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    image_paths = []
    first_doc_id = None
    original_name = "images_to_pdf.pdf"
    
    for doc_id in document_ids:
        # Ensure doc_id is UUID
        if isinstance(doc_id, str):
            try:
                doc_uuid = uuid.UUID(doc_id)
            except ValueError:
                continue
        else:
            doc_uuid = doc_id
            
        document = await doc_service.get_by_id(doc_uuid)
        if document:
            if first_doc_id is None:
                first_doc_id = str(doc_uuid)
                original_name = f"{Path(document.original_name).stem}_combined.pdf"
            image_paths.append(Path(settings.UPLOAD_DIR) / document.storage_key)
    
    if not image_paths:
        raise HTTPException(status_code=400, detail="No valid images provided")
    
    conversion = await conv_service.create_conversion(
        document_id=first_doc_id,
        conversion_type=ConversionType.IMAGES_TO_PDF,
        user_id=user_id,
        target_format="pdf",
    )
    
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pdf"
    
    try:
        ConverterEngine.images_to_pdf(
            image_paths=image_paths,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), original_name)
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/html-to-pdf", response_model=ConversionResponse)
async def convert_html_to_pdf(
    request: HtmlToPdfRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert HTML to PDF"""
    if not request.html_content and not request.url:
        raise HTTPException(status_code=400, detail="Either html_content or url must be provided")
    
    conv_service = ConversionService(db)
    
    conversion = await conv_service.create_conversion(
        document_id=None,
        conversion_type=ConversionType.HTML_TO_PDF,
        user_id=user_id,
        target_format="pdf",
        options=request.options
    )
    
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pdf"
    
    try:
        ConverterEngine.html_to_pdf(
            html_content=request.html_content,
            url=request.url,
            output_path=output_path,
            options=request.options
        )
        await conv_service.mark_completed(conversion.id, str(output_path), "converted_html.pdf")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/markdown-to-pdf", response_model=ConversionResponse)
async def convert_markdown_to_pdf(
    request: MarkdownToPdfRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert Markdown to PDF"""
    conv_service = ConversionService(db)
    
    conversion = await conv_service.create_conversion(
        document_id=None,
        conversion_type=ConversionType.MARKDOWN_TO_PDF,
        user_id=user_id,
        target_format="pdf",
        options=request.options
    )
    
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pdf"
    
    try:
        ConverterEngine.markdown_to_pdf(
            markdown_content=request.markdown_content,
            output_path=output_path,
            options=request.options
        )
        await conv_service.mark_completed(conversion.id, str(output_path), "converted_markdown.pdf")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/pdf-to-word", response_model=ConversionResponse)
async def convert_pdf_to_word(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PDF to Word (DOCX)"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_WORD,
        user_id=user_id,
        target_format="docx",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.docx"
    
    try:
        ConverterEngine.pdf_to_word(
            pdf_path=input_path,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.docx")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/word-to-pdf", response_model=ConversionResponse)
async def convert_word_to_pdf(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert Word (DOCX) to PDF"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.WORD_TO_PDF,
        user_id=user_id,
        target_format="pdf",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pdf"
    
    try:
        ConverterEngine.word_to_pdf(
            docx_path=input_path,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.pdf")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/excel-to-pdf", response_model=ConversionResponse)
async def convert_excel_to_pdf(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert Excel to PDF"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.EXCEL_TO_PDF,
        user_id=user_id,
        target_format="pdf",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pdf"
    
    try:
        ConverterEngine.excel_to_pdf(
            xlsx_path=input_path,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.pdf")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/ppt-to-pdf", response_model=ConversionResponse)
async def convert_ppt_to_pdf(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PowerPoint to PDF"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PPT_TO_PDF,
        user_id=user_id,
        target_format="pdf",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pdf"
    
    try:
        ConverterEngine.ppt_to_pdf(
            pptx_path=input_path,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.pdf")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/pdf-to-excel", response_model=ConversionResponse)
async def convert_pdf_to_excel(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PDF to Excel (XLSX)"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_EXCEL,
        user_id=user_id,
        target_format="xlsx",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.xlsx"
    
    try:
        ConverterEngine.pdf_to_excel(
            pdf_path=input_path,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.xlsx")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/pdf-to-ppt", response_model=ConversionResponse)
async def convert_pdf_to_ppt(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PDF to PowerPoint (PPTX)"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_PPT,
        user_id=user_id,
        target_format="pptx",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pptx"
    
    try:
        ConverterEngine.pdf_to_ppt(
            pdf_path=input_path,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.pptx")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/pdf-to-text", response_model=ConversionResponse)
async def convert_pdf_to_text(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PDF to Text (TXT)"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_TEXT,
        user_id=user_id,
        target_format="txt",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.txt"
    
    try:
        ConverterEngine.pdf_to_text(
            pdf_path=input_path,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.txt")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/pdf-to-html", response_model=ConversionResponse)
async def convert_pdf_to_html(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PDF to HTML"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_HTML,
        user_id=user_id,
        target_format="html",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.html"
    
    try:
        ConverterEngine.pdf_to_html(
            pdf_path=input_path,
            output_path=output_path
        )
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.html")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    conversion = await conv_service.get_by_id(conversion.id)
    return conversion


@router.post("/pdf-to-csv", response_model=ConversionResponse)
async def convert_pdf_to_csv(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Extract tabular data from PDF to CSV"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_CSV,
        user_id=user_id,
        target_format="csv",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.csv"
    
    try:
        ConverterEngine.pdf_to_csv(pdf_path=input_path, output_path=output_path)
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.csv")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    return await conv_service.get_by_id(conversion.id)


@router.post("/pdf-to-xml", response_model=ConversionResponse)
async def convert_pdf_to_xml(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PDF to XML format"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_XML,
        user_id=user_id,
        target_format="xml",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.xml"
    
    try:
        ConverterEngine.pdf_to_xml(pdf_path=input_path, output_path=output_path)
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.xml")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    return await conv_service.get_by_id(conversion.id)


@router.post("/pdf-to-json", response_model=ConversionResponse)
async def convert_pdf_to_json(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert PDF to JSON format"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.PDF_TO_JSON,
        user_id=user_id,
        target_format="json",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.json"
    
    try:
        ConverterEngine.pdf_to_json(pdf_path=input_path, output_path=output_path)
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.json")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    return await conv_service.get_by_id(conversion.id)


@router.post("/csv-to-pdf", response_model=ConversionResponse)
async def convert_csv_to_pdf(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert CSV to PDF report"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.CSV_TO_PDF,
        user_id=user_id,
        target_format="pdf",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pdf"
    
    try:
        ConverterEngine.csv_to_pdf(csv_path=input_path, output_path=output_path)
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.pdf")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    return await conv_service.get_by_id(conversion.id)


@router.post("/json-to-pdf", response_model=ConversionResponse)
async def convert_json_to_pdf(
    request: ConversionRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """Convert JSON to PDF report"""
    doc_service = DocumentService(db)
    conv_service = ConversionService(db)
    
    document = await doc_service.get_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    conversion = await conv_service.create_conversion(
        document_id=str(request.document_id),
        conversion_type=ConversionType.JSON_TO_PDF,
        user_id=user_id,
        target_format="pdf",
    )
    
    input_path = Path(settings.UPLOAD_DIR) / document.storage_key
    output_path = Path(settings.PROCESSED_DIR) / f"{conversion.id}.pdf"
    
    try:
        ConverterEngine.json_to_pdf(json_path=input_path, output_path=output_path)
        await conv_service.mark_completed(conversion.id, str(output_path), f"{Path(document.original_name).stem}.pdf")
    except Exception as e:
        await conv_service.mark_failed(conversion.id, str(e))
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    return await conv_service.get_by_id(conversion.id)


@router.get("/status/{conversion_id}", response_model=ConversionStatusResponse)
@router.get("/{conversion_id}/status", response_model=ConversionStatusResponse)
async def get_conversion_status(
    conversion_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get conversion job status"""
    conv_service = ConversionService(db)
    conversion = await conv_service.get_by_id(conversion_id)
    
    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")
    
    result_url = None
    if conversion.result_key:
        result_url = f"/api/v1/convert/{conversion_id}/download"
    
    return ConversionStatusResponse(
        id=conversion.id,
        status=conversion.status,
        progress=conversion.progress or 0,
        current_step=conversion.current_step or "",
        result_url=result_url,
        result_filename=conversion.result_filename,
        error_message=conversion.error_message,
        processing_time_ms=conversion.processing_time_ms
    )


@router.get("/download/{conversion_id}")
@router.get("/{conversion_id}/download")
async def download_conversion_result(
    conversion_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Download conversion result"""
    conv_service = ConversionService(db)
    conversion = await conv_service.get_by_id(conversion_id)
    
    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")
    
    if conversion.status != ConversionStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Conversion not completed")
    
    if not conversion.result_key:
        raise HTTPException(status_code=404, detail="Result not found")
    
    result_path = Path(conversion.result_key)
    if not result_path.exists():
        result_path = Path(settings.PROCESSED_DIR) / f"{conversion_id}.{conversion.target_format or 'pdf'}"
    
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Result file not found")
    
    filename = conversion.result_filename or f"converted.{conversion.target_format}"
    
    return FileResponse(
        path=str(result_path),
        filename=filename,
        media_type="application/octet-stream"
    )
