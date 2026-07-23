$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('e:\40. Web\appsekda\WEB SIPROPER.docx')
$doc.Content.Text | Out-File -FilePath 'e:\40. Web\appsekda\WEB_SIPROPER.txt' -Encoding utf8
$doc.Close()
$word.Quit()
