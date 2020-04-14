# read in csv. add to dictionary/data structure. update existing if already present

# for the first version, we just need to have: START DATE, CALL LENGTH, TYPE, HOUR OF THE DAY

# write back out to new csv file

import csv
from datetime import datetime
from datetime import time

results={}
headers = {}

with open('tenderloin-2019-processed-v2.csv', mode='r') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    line_count = 0
    for row in csv_reader:
        line_count += 1
        if row.get("CallNumber") in results:
            callnum = row.get("CallNumber")
            # sum up times
            duration = float(results.get(callnum).get("CallDuration"))
            duration += float(row.get("CallDuration"))
            results.get(callnum)["CallDuration"] = str(duration)
            # append unit IDs
            units = results.get(callnum).get("UnitID")
            units += " " + row.get("UnitID")
            results.get(callnum)["UnitID"] = units
            # update last unit available time
            prevseentime = datetime.strptime(results.get(callnum).get("AvailableDtTm"), '%m/%d/%y %I:%M:%S %p')
            thistime = datetime.strptime(row.get("AvailableDtTm"), '%m/%d/%y %I:%M:%S %p')
            if thistime > prevseentime:
                results.get(callnum)["AvailableDtTm"] = thistime.strftime('%m/%d/%y %I:%M:%S %p')

        else:
            results[row.get("CallNumber")] = row

        if line_count == 1:
            headers = row.keys()
    print(line_count)

print("dog")
print(results.values())

with open("processed.csv", "w") as file:
    writer = csv.writer(file, delimiter = ",", lineterminator = "\n")
    #writer.writerows(results.values())

    writer.writerow(headers)
    for row_cells in results.values():
        writer.writerow(row_cells.values())

# 1/1/2019  10:59:10 PM
#datetime_object = datetime.strptime("1/1/2019 1:59:10 PM", '%m/%d/%Y %H:%M:%S %p')

