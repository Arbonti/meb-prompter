import xlrd

wb = xlrd.open_workbook(r'data\ilkokul_2122.xls')
ws = wb.sheet_by_index(0)
print(f"ncols={ws.ncols}")

for i in range(min(15, ws.nrows)):
    row = ws.row_values(i)
    for j, v in enumerate(row):
        if v not in ('', None, 0.0):
            print(f"  R{i+1} C{j}: {repr(v)[:40]}")
